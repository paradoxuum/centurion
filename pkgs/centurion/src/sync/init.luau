local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local argument = require("./argument")
local command = require("./command")
local patch = require("@self/patch")
local types = require("./types")

export type SyncPayload =
	{
		type: "init",
		data: types.CommandMap,
	}
	| {
		type: "patch",
		data: types.CommandMap,
	}

export type SyncCallback = (player: Player, payload: SyncPayload) -> ()

export type PlayerSyncer = {
	hydrate: () -> (),
	connect: (callback: (player: Player, payload: SyncPayload) -> ()) -> () -> (),
}

local function client()
	local hydrated = false

	local function process_cmd(cmd): any
		local args: { any } = cmd.arguments
		for _, arg in args do
			local arg_type = argument.types[arg.type]
			if not arg_type then
				error(`Unknown argument type '{arg.type}' for argument '{arg.name}'`)
			end

			arg.transform = arg_type.transform
			arg.suggestions = arg_type.suggestions
		end

		cmd.arguments = function()
			return table.unpack(args)
		end :: any

		return cmd
	end

	local function hydrate(state: types.CommandMap)
		hydrated = true

		for key, value in state do
			command.register(key, process_cmd(value))
		end
	end

	local function apply(data: types.CommandMap)
		local target = patch.apply(table.clone(command.commands), data)
		for key, cmd in command.commands do
			if target[key] == nil then
				command.unregister(key)
			else
				command.commands[key] = process_cmd(cmd)
			end
		end
	end

	local function sync(...)
		for index = 1, select("#", ...) do
			local payload: SyncPayload = select(index, ...)

			if payload.type == "init" then
				hydrate(payload.data)
			elseif hydrated then
				apply(payload.data)
			end
		end
	end

	return {
		sync = sync,
	}
end

local function player_syncer(player: Player, serialize: boolean?): PlayerSyncer
	local sync: (player: Player, payload: SyncPayload) -> ()

	local previousSnapshot = table.clone(command.commands)
	local currentSnapshot = table.clone(previousSnapshot)
	local changed = false

	local function hydrate()
		assert(sync, "connect() must be called before hydrate()")

		local cmds: { [string]: any } = table.clone(command.commands)
		for k, cmd in cmds do
			local sync_cmd = table.clone(cmd)
			sync_cmd.arguments = { cmd.arguments() }
			cmds[k] = sync_cmd
		end

		sync(
			player,
			{
				type = "init",
				data = cmds,
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

		local connection = RunService.Heartbeat:Connect(function()
			if not changed then
				return
			end

			local payload = {
				type = "patch",
				data = patch.diff(previousSnapshot, currentSnapshot, serialize),
			} :: SyncPayload

			previousSnapshot = table.clone(currentSnapshot)
			changed = false
			callback(player, payload)
		end)

		return function()
			disconnect_register()
			disconnect_unregister()
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

	local function connect(callback: SyncCallback)
		Players.PlayerAdded:Connect(function(player)
			local syncer = player_syncer(player, true)
			syncers[player] = syncer
			connections[player] = syncer.connect(callback)
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
				syncers[player] = player_syncer(player, true)
				connections[player] = syncers[player].connect(callback)
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
	-- local request = Instance.new("RemoteEvent")
	-- request.Name = "request"
	-- request.Parent = folder

	-- local sync_state = Instance.new("RemoteEvent")
	-- sync_state.Name = "sync"
	-- sync_state.Parent = folder

	-- local execute = Instance.new("RemoteFunction")
	-- execute.Name = "execute"
	-- execute.Parent = folder

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
	local argument = require("./argument")
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
