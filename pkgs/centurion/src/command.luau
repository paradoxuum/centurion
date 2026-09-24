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

local function check_arity(name: string, callback: (...any) -> any, declared: number, offset: number)
	local nparams, is_vararg = debug.info(callback, "a")

	if is_vararg or nparams == 0 then
    	return
	end

	local takes = (nparams :: number) - offset
	if takes ~= declared then
	    warn(`Command '{name}' declares {declared} {declared == 1 and "argument" or "arguments"} but its callback takes {takes}.`)
    end
end

local function validate_command(name: string, command: types.Command<unknown>)
	local args: { types.Argument } = command.arguments and { command.arguments() } :: { types.Argument } or {}

	local optional_found = false
	for i, arg in args do
		assert(argument.types[arg.type], `Argument type '{arg.type}' for argument '{arg.name}' is not registered.`)

		if arg.optional then
			optional_found = true
		elseif optional_found then
			error(`Required argument '{arg.name}' cannot follow an optional argument.`)
		end

		local n = arg.num_args
		if n == "rest" then
			if i ~= #args then
				error(`Argument '{arg.name}' is declared as 'rest' but is not the last argument.`)
			end
		elseif n ~= nil and (type(n) ~= "number" or n < 1 or n % 1 ~= 0) then
			error(`Argument '{arg.name}' has an invalid num_args: {n}. Expected a whole number of at least 1.`)
		end
	end

	-- a command synced from the server has no callback on the client, since it
	-- executes over the network handler instead
	if command.callback then
		check_arity(name, command.callback :: any, #args, 1)
	end
end

local function register<T...>(name: string | { string }, command: types.Command<T...>)
	local names: { string } = typeof(name) == "string" and { name } or (name :: { string })

	validate_command(names[1], command :: types.Command<unknown>)

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
	check_arity = check_arity,
}
