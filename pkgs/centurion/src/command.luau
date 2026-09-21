local argument = require("./argument")
local context = require("./context")
local guard = require("./guard")
local permission = require("./permission")
local types = require("./types")

local commands: types.CommandMap = {}

type RegisterCallback = (name: string, command: types.Command<unknown>) -> ()

local on_register_callbacks: { RegisterCallback } = {}
local on_unregister_callbacks: { RegisterCallback } = {}
local on_execute_callbacks: { (ctx: types.ExecutionContext) -> () } = {}

type NetworkHandler = (command: string, args: { string }?, input: string?) -> types.ExecutionContext

local network_handler: NetworkHandler?

local function set_network_handler(callback: NetworkHandler)
	network_handler = callback
end

local function call_guard(ctx: types.ExecutionContext, name: string, callback: (ctx: types.ExecutionContext) -> boolean)
	local result, value = pcall(callback :: any, ctx)
	if not result then
		warn(`Guard execution failed for '{name}': ` .. tostring(value))
		ctx.error("Failed to execute command.")
		return false
	end

	return value :: boolean
end

-- `input` is the raw, untokenized string the executor submitted. Pass it
-- whenever it's available so that `ctx.input` keeps the original quoting.
local function execute(executor: Player, name: string, args: { string }?, input: string?): types.ExecutionContext
	local command = commands[name]
	if not command then
		return context(executor, name, args or {}, input)
	end

	if not permission.can_execute(executor, command) then
		local ctx = context(executor, name, args or {}, input)

		if not permission.options.hide then
			ctx.error("You do not have permission to execute this command.")
		end

		return ctx
	end

	if not command.callback then
		assert(network_handler, "Network handler must be set before server command execution on the client.")
		return network_handler(name, args, input)
	end

	args = args or {}
	local ctx = context(executor, name, args, input)

	for i, v in guard.global_guards do
		if not call_guard(ctx, `global guard #{i}`, v) then
			return ctx
		end
	end

	if command.guards then
		for i, cmd_guard in command.guards do
			if type(cmd_guard) ~= "string" then
				if not call_guard(ctx, `guard #{i}`, cmd_guard :: types.Guard) then
					return ctx
				end
				continue
			end

			local guard_callback = guard.guards[cmd_guard]
			assert(guard_callback, "Guard '" .. cmd_guard .. "' is not registered.")

			if not call_guard(ctx, cmd_guard, guard_callback) then
				return ctx
			end
		end
	end

	-- always transform, even with no declared arguments, so that commands
	-- taking none still reject extra input
	local command_args: { types.Argument } = if command.arguments
		then { command.arguments() } :: { types.Argument }
		else {}

	local res = argument.transform(executor, args, command_args)
	if not res.success then
		ctx.error(res.error)
		return ctx
	end

	-- unpack up to the declared argument count so that omitted optional
	-- arguments don't truncate the ones after them
	local success, value = pcall(command.callback :: any, ctx, unpack(res.value, 1, #command_args))
	if not success then
		warn(`Failed to execute '{ctx.input}': ` .. tostring(value))
		ctx.error("Failed to execute command.")
		return ctx
	end

	if type(value) == "string" then
		ctx.reply(value)
	end

	for _, callback in on_execute_callbacks do
		callback(ctx)
	end

	return ctx
end

local function register<T...>(name: string | { string }, command: types.Command<T...>)
	local names: { string } = typeof(name) == "string" and { name } or (name :: { string })

	for _, name in names do
		assert(commands[name] == nil, "Command with name '" .. name .. "' is already registered.")
		commands[name] = command :: any
	end

	for _, callback in on_register_callbacks do
		callback(names[1], command :: types.Command<unknown>)
	end
end

local function unregister(name: string)
	assert(commands[name] ~= nil, "Command with name '" .. name .. "' is not registered.")

	local command = commands[name]

	for name, cmd in commands do
		if command == cmd then
			commands[name] = nil
		end
	end

	for _, callback in on_unregister_callbacks do
		callback(name, command :: types.Command<unknown>)
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
