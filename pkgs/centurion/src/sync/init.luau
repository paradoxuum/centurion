local RunService = game:GetService("RunService")

local command = require("./command")
local patch = require("@self/patch")
local types = require("./types")

export type SyncPayload = {
	type: "init",
	data: types.CommandMap,
} | {
	type: "patch",
	data: types.CommandMap,
}

local function client()
	local hydrated = false

	local function hydrate(state: types.CommandMap)
		hydrated = true

		for key, value in state do
			command.register(key, value)
		end
	end

	local function apply(data: types.CommandMap)
		local target = patch.apply(table.clone(command.commands), data)
		for key, cmd in command.commands do
			if target[key] == nil then
				command.unregister(key)
			else
				command.commands[key] = cmd
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

local function server(serialize: boolean?)
	local sync: (player: Player, payload: SyncPayload) -> ()

	local previousSnapshot = table.clone(command.commands)
	local currentSnapshot = table.clone(previousSnapshot)
	local changed = false

	local function hydrate(player: Player)
		assert(sync, "connect() must be called before hydrate()")

		sync(
			player,
			{
				type = "init",
				data = table.clone(command.commands),
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

			for _, player in game:GetService("Players"):GetPlayers() do
				callback(player, payload)
			end
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

return {
	client = client,
	server = server,
}
