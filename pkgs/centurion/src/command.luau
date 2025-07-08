local argument = require("./argument")
local context = require("./context")
local guard = require("./guard")
local types = require("./types")

local commands: types.CommandMap = {}

type RegisterCallback = (name: string, command: types.Command) -> ()

local on_register_callbacks: { RegisterCallback } = {}
local on_unregister_callbacks: { RegisterCallback } = {}
local on_execute_callbacks: { (ctx: types.ExecutionContext) -> () } = {}

type NetworkHandler = (command: string, args: { string }?) -> types.ExecutionContext

local network_handler: NetworkHandler?

local function set_network_handler(callback: NetworkHandler)
	network_handler = callback
end

local function call_guard(ctx: types.ExecutionContext, name: string, callback: (ctx: types.ExecutionContext) -> boolean)
	local result, value = pcall(callback, ctx)
	if not result then
		warn(`Guard execution failed for '{name}': ` .. tostring(value))
		ctx.error("Failed to execute command.")
		return false
	end

	return value :: boolean
end

local function execute(executor: Player, name: string, args: { string }?): types.ExecutionContext
	local command = commands[name]
	assert(command, "Command '" .. name .. "' is not registered.")

	if not command.callback then
		assert(network_handler, "Network handler must be set before client-sided server command execution.")
		return network_handler(name, args)
	end

	args = args or {}
	local ctx = context(executor, name, args)

	for i, v in guard.global_guards do
		if not call_guard(ctx, `global guard #{i}`, v) then
			return ctx
		end
	end

	if command.guards then
		for _, guard_name in command.guards do
			local guard_callback = guard.guards[guard_name]
			assert(guard_callback, "Guard '" .. guard_name .. "' is not registered.")

			if not call_guard(ctx, guard_name, guard_callback) then
				return ctx
			end
		end
	end

	local transformed_args = {}
	if command.arguments then
		local res = argument.transform(executor, args, command.arguments)
		if not res.success then
			ctx.error(res.error)
			return ctx
		end
		transformed_args = res.value
	end

	local success, value = pcall(command.callback, ctx, table.unpack(transformed_args))
	if not success then
		warn(`Failed to execute '{ctx.input}': ` .. tostring(value))
		ctx.error("Failed to execute command.")
		return ctx
	end

	if type(value) == "string" then
		ctx.reply(value)
	end

	return ctx
end

local function register(name: string, command: types.Command)
	assert(commands[name] == nil, "Command with name '" .. name .. "' is already registered.")
	commands[name] = command

	for _, callback in on_register_callbacks do
		callback(name, command)
	end
end

local function unregister(name: string)
	assert(commands[name] ~= nil, "Command with name '" .. name .. "' is not registered.")

	local command = commands[name]
	commands[name] = nil

	for _, callback in on_unregister_callbacks do
		callback(name, command)
	end
end

local function on_register(callback: RegisterCallback)
	table.insert(on_register_callbacks, callback)

	return function()
		table.remove(on_register_callbacks, table.find(on_register_callbacks, callback))
	end
end

local function on_unregister(callback: RegisterCallback)
	table.insert(on_unregister_callbacks, callback)

	return function()
		table.remove(on_unregister_callbacks, table.find(on_unregister_callbacks, callback))
	end
end

local function on_execute(callback: (ctx: types.ExecutionContext) -> ())
	table.insert(on_execute_callbacks, callback)

	return function()
		table.remove(on_execute_callbacks, table.find(on_execute_callbacks, callback))
	end
end

return {
	set_network_handler = set_network_handler,
	execute = execute,
	register = register,
	unregister = unregister,
	on_register = on_register,
	on_unregister = on_unregister,
	on_execute = on_execute,
	commands = commands,
}
