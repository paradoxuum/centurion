local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local command = require("./command")
local patch = require("@self/patch")
local permission = require("./permission")
local types = require("./types")

type CommandState = {
	kind: "command",
	data: types.Command<unknown>,
}

type NetworkedState = CommandState | { kind: "none" }

type NetworkedMap = { [string]: NetworkedState }

type PatchDiff = { [string]: types.Command<unknown> | { __none: string } }

export type SyncPayload =
	{
		type: "init",
		data: NetworkedMap,
	}
	| {
		type: "patch",
		data: NetworkedMap,
	}

export type SyncCallback = (player: Player, payload: SyncPayload) -> ()

export type PlayerSyncer = {
	hydrate: () -> (),
	connect: (callback: (player: Player, payload: SyncPayload) -> ()) -> () -> (),
}

local function client()
	local hydrated = false

	local function process_cmd(cmd): any
		local args: { any }? = cmd.arguments
		if not args then
			return cmd
		end

		cmd.arguments = function()
			return table.unpack(args)
		end :: any

		return cmd
	end

	local function hydrate(state: PatchDiff)
		hydrated = true

		for key, value in state do
			if value == patch.None then
				command.unregister(key)
				continue
			end
			command.register(key, process_cmd(value))
		end
	end

	local function apply(data: PatchDiff)
		local target = patch.apply(table.clone(command.commands), data)
		for key, _ in command.commands do
			if target[key] == nil then
				command.unregister(key)
			end
		end

		for key, cmd in target do
			if command.commands[key] == nil then
				command.register(key, process_cmd(cmd))
			end
		end
	end

	local function sync(...)
		for index = 1, select("#", ...) do
			local payload: SyncPayload = select(index, ...)

			local data: PatchDiff = {}
			for k, v in payload.data do
				if v.kind == "none" then
					data[k] = patch.None
				else
					data[k] = v.data
				end
			end

			if payload.type == "init" then
				hydrate(data)
			elseif hydrated then
				apply(data)
			end
		end
	end

	return {
		sync = sync,
	}
end

local function player_syncer(player: Player, serialize: boolean?): PlayerSyncer
	local sync: (player: Player, payload: SyncPayload) -> ()

	local previousSnapshot = {}
	local currentSnapshot = {}
	local changed = false

	local function update()
		previousSnapshot = table.clone(currentSnapshot)
		currentSnapshot = {}
		for k, v in command.commands do
			if permission.can_execute(player, v) or not permission.options.hide then
				currentSnapshot[k] = v
			end
		end
	end

	local function process(commands: types.CommandMap): NetworkedMap
		local processed = {}
		for k, cmd in commands do
			if cmd == patch.None then
				processed[k] = { kind = "none" }
				continue
			end

			local sync_cmd = cmd
			if cmd.arguments ~= nil then
				sync_cmd = table.clone(cmd)
				sync_cmd.arguments = { cmd.arguments() } :: any
			end

			processed[k] = {
				kind = "command",
				data = sync_cmd,
			}
		end
		return processed
	end

	local function hydrate()
		assert(sync, "connect() must be called before hydrate()")

		update()
		sync(
			player,
			{
				type = "init",
				data = process(currentSnapshot),
			} :: SyncPayload
		)
	end

	local function connect(callback)
		sync = callback

		local disconnect_register = command.on_register(function()
			changed = true
		end)

		local disconnect_unregister = command.on_unregister(function()
			changed = true
		end)

		local disconnect_permission_roles = permission.on_roles_changed(player, function()
			changed = true
		end)

		local disconnect_permission_opts = permission.on_options_changed(function()
			changed = true
		end)

		local connection = RunService.Heartbeat:Connect(function()
			if not changed then
				return
			end

			update()

			local diff = patch.diff(previousSnapshot, currentSnapshot, serialize) :: types.CommandMap
			local payload = {
				type = "patch",
				data = process(diff),
			} :: SyncPayload
			changed = false

			if next(payload.data) == nil then
				return
			end

			callback(player, payload)
		end)

		return function()
			disconnect_register()
			disconnect_unregister()
			disconnect_permission_roles()
			disconnect_permission_opts()
			connection:Disconnect()
		end
	end

	return {
		hydrate = hydrate,
		connect = connect,
	}
end

local function server()
	local syncers: { [Player]: PlayerSyncer } = {}
	local connections: { [Player]: () -> () } = {}

	local function hydrate(player: Player)
		local syncer = syncers[player]
		if syncer then
			syncer.hydrate()
		end
	end

	local function setup_player(player: Player, callback: SyncCallback)
		local syncer = player_syncer(player, true)
		syncers[player] = syncer
		connections[player] = syncer.connect(callback)
	end

	local function connect(callback: SyncCallback)
		Players.PlayerAdded:Connect(function(player)
			setup_player(player, callback)
		end)

		Players.PlayerRemoving:Connect(function(player)
			local disconnect = connections[player]
			if disconnect then
				disconnect()
				connections[player] = nil
			end
		end)

		for _, player in Players:GetPlayers() do
			if not syncers[player] then
				setup_player(player, callback)
			end
		end

		return function()
			for _, disconnect in connections do
				disconnect()
			end
			connections = {}
		end
	end

	return {
		hydrate = hydrate,
		connect = connect,
	}
end

local function network_server()
	local syncer = server()

	local server_remotes = require("@self/network/server")
	server_remotes.RequestState.SetCallback(function(player)
		syncer.hydrate(player)
	end)

	syncer.connect(function(player, payload)
		server_remotes.SyncState.Fire(player, payload :: any)
	end)

	server_remotes.Execute.SetCallback(function(player, cmd, args): types.ExecutionContext
		return command.execute(player, cmd, args)
	end)
end

local function network_client()
	local client_remotes = require("@self/network/client")
	local syncer = client()

	command.set_network_handler(function(cmd, args)
		return client_remotes.Execute.Call(cmd, args) :: types.ExecutionContext
	end)

	client_remotes.SyncState.SetCallback(function(...)
		syncer.sync(...)
	end)

	client_remotes.RequestState.Fire()
end

local function setup_networking()
	if RunService:IsServer() then
		network_server()
	else
		network_client()
	end
end

return {
	client = client,
	server = server,
	setup = setup_networking,
}
