local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local command = require("./command")
local permission = require("./permission")
local types = require("./types")

type CommandState = {
	kind: "command",
	data: types.Command<unknown>,
}

type NetworkedState = CommandState | { kind: "none" }

type NetworkedMap = { [string]: NetworkedState }

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

local function client()
	local hydrated = false
	local synced: types.CommandMap = {}

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

	local function remove(key: string)
		local cmd = synced[key]
		if cmd == nil then
			return
		end

		synced[key] = nil
		if command.commands[key] == cmd then
			command.unregister(key)
		end
	end

	local function add(key: string, data: types.Command<unknown>)
		remove(key)

		if command.commands[key] ~= nil then
			warn(`Command '{key}' is already registered on the client, so the server's command was not synced.`)
			return
		end

		-- one command failing to register (e.g. an argument type that only
		-- exists on the server) shouldn't stop the rest of the payload
		local cmd = process_cmd(data)
		local ok, err = pcall(function()
			command.register(key, cmd)
		end)
		if not ok then
			warn(`Failed to sync command '{key}': {err}`)
			return
		end

		synced[key] = cmd
	end

	local function hydrate(state: NetworkedMap)
		hydrated = true

		for key in synced do
			if state[key] == nil then
				remove(key)
			end
		end

		for key, value in state do
			if value.kind == "command" then
				add(key, value.data)
			end
		end
	end

	local function apply(data: NetworkedMap)
		for key, value in data do
			if value.kind == "command" then
				add(key, value.data)
			else
				remove(key)
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

-- only what the client needs: the callback, guards and permissions stay on the
-- server, and the client executes over the network handler instead
local function serialize(cmd: types.Command<unknown>): NetworkedState
	return {
		kind = "command",
		data = {
			description = cmd.description,
			arguments = if cmd.arguments then { cmd.arguments() } else nil,
		} :: any,
	}
end

type PlayerState = {
	-- the commands this player can currently see, as last sent to them
	visible: types.CommandMap,
	hydrated: boolean,
	dirty: boolean,
	disconnect: () -> (),
}

local function server()
	local players: { [Player]: PlayerState } = {}
	local send: SyncCallback?

	local registry: types.CommandMap = {}
	local registry_dirty = false
	local options_dirty = false

	-- a command only changes by being registered again, so it can be
	-- serialized once and the result reused for every player and every tick
	local serialized: { [types.Command<unknown>]: NetworkedState } = setmetatable({}, { __mode = "k" }) :: any

	local function get_serialized(cmd: types.Command<unknown>): NetworkedState
		local state = serialized[cmd]
		if state == nil then
			state = serialize(cmd)
			serialized[cmd] = state
		end
		return state
	end

	local function is_visible(player: Player, cmd: types.Command<unknown>)
		return not permission.options.hide or permission.can_execute(player, cmd)
	end

	local function update_key(player: Player, state: PlayerState, key: string, changes: NetworkedMap)
		local cmd = registry[key]
		local now = if cmd ~= nil and is_visible(player, cmd) then cmd else nil

		if state.visible[key] ~= now then
			state.visible[key] = now
			changes[key] = if now then get_serialized(now) else { kind = "none" }
		end
	end

	local function add_player(player: Player): PlayerState
		local existing = players[player]
		if existing then
			return existing
		end

		local state: PlayerState
		state = {
			visible = {},
			hydrated = false,
			dirty = false,
			disconnect = permission.on_roles_changed(player, function()
				state.dirty = true
			end),
		}
		players[player] = state
		return state
	end

	local function remove_player(player: Player)
		local state = players[player]
		if state then
			state.disconnect()
			players[player] = nil
		end
	end

	local function hydrate(player: Player)
		assert(send, "connect() must be called before hydrate()")

		local state = players[player]
		if not state then
			if player.Parent ~= Players then
				return
			end
			state = add_player(player)
		end

		state.hydrated = true
		state.dirty = false
		state.visible = {}

		local data = {}
		for key, cmd in registry do
			if is_visible(player, cmd) then
				state.visible[key] = cmd
				data[key] = get_serialized(cmd)
			end
		end

		send(
			player,
			{
				type = "init",
				data = data,
			} :: SyncPayload
		)
	end

	local function connect(callback: SyncCallback)
		send = callback
		registry = table.clone(command.commands)

		local disconnect_register = command.on_register(function()
			registry_dirty = true
		end)

		local disconnect_unregister = command.on_unregister(function()
			registry_dirty = true
		end)

		local disconnect_options = permission.on_options_changed(function()
			options_dirty = true
		end)

		local heartbeat = RunService.Heartbeat:Connect(function()
			-- the registry is diffed once, and each player then only rechecks
			-- the keys that changed. a player whose roles changed, or everyone
			-- when the permission options change, is rechecked in full
			local changed_keys: { [string]: true } = {}
			if registry_dirty then
				for key, cmd in registry do
					if command.commands[key] ~= cmd then
						changed_keys[key] = true
					end
				end
				for key, cmd in command.commands do
					if registry[key] ~= cmd then
						changed_keys[key] = true
					end
				end
				registry = table.clone(command.commands)
			end

			local recheck_all = options_dirty
			registry_dirty = false
			options_dirty = false

			if next(changed_keys) == nil and not recheck_all then
				local any_dirty = false
				for _, state in players do
					if state.dirty then
						any_dirty = true
						break
					end
				end

				if not any_dirty then
					return
				end
			end

			for player, state in players do
				local full = recheck_all or state.dirty
				state.dirty = false

				if not state.hydrated then
					continue
				end

				local changes: NetworkedMap = {}
				if full then
					for key in state.visible do
						if registry[key] == nil then
							update_key(player, state, key, changes)
						end
					end
					for key in registry do
						update_key(player, state, key, changes)
					end
				else
					for key in changed_keys do
						update_key(player, state, key, changes)
					end
				end

				if next(changes) ~= nil then
					callback(
						player,
						{
							type = "patch",
							data = changes,
						} :: SyncPayload
					)
				end
			end
		end)

		local player_added = Players.PlayerAdded:Connect(function(player)
			add_player(player)
		end)
		local player_removing = Players.PlayerRemoving:Connect(remove_player)

		for _, player in Players:GetPlayers() do
			add_player(player)
		end

		return function()
			disconnect_register()
			disconnect_unregister()
			disconnect_options()
			heartbeat:Disconnect()
			player_added:Disconnect()
			player_removing:Disconnect()

			for player in players do
				remove_player(player)
			end
			send = nil
		end
	end

	return {
		hydrate = hydrate,
		connect = connect,
	}
end

local function network_server()
	local syncer = server()

	local server_remotes = require("./network/server")
	server_remotes.RequestState.SetCallback(function(player)
		syncer.hydrate(player)
	end)

	syncer.connect(function(player, payload)
		server_remotes.SyncState.Fire(player, payload :: any)
	end)

	server_remotes.Execute.SetCallback(function(player, cmd, args, input): types.ExecutionContext
		return command.execute(player, cmd, args, input)
	end)
end

local function network_client()
	local client_remotes = require("./network/client")
	local syncer = client()

	command.set_network_handler(function(cmd, args, input)
		return client_remotes.Execute.Call(cmd, args, input) :: types.ExecutionContext
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
