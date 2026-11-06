local argument = require("./argument")
local context = require("./context")
local guard = require("./guard")
local log = require("./log")
local permission = require("./permission")
local services = require("./services")
local types = require("./types")

local commands: types.CommandMap = {}

type RegisterCallback = (name: string, command: types.Command<unknown>) -> ()

local on_register_callbacks: { RegisterCallback } = {}
local on_unregister_callbacks: { RegisterCallback } = {}
local on_execute_callbacks: { (ctx: types.ExecutionContext) -> () } = {}
local on_fail_callbacks: { (ctx: types.ExecutionContext, reason: types.FailReason) -> () } = {}

type NetworkHandler = (command: string, args: { string }?, input: string?) -> types.ExecutionContext

local network_handler: NetworkHandler?

local function set_network_handler(callback: NetworkHandler)
	network_handler = callback
end

local function notify(event: string, listeners: { (...any) -> () }, ctx: types.ExecutionContext, ...: any)
	for _, callback in table.clone(listeners) do
		local ok, err = xpcall(callback :: any, log.capture, ctx, ...)
		if not ok then
			local caught: log.CaughtError = err
			log.error(`{event} listener failed for '{ctx.input}': {caught.message}`, {
				executor = ctx.executor,
				command = ctx.command,
				input = ctx.input,
				traceback = caught.traceback,
			})
		end
	end
end

local function fail(ctx: types.ExecutionContext, reason: types.FailReason): types.ExecutionContext
	notify("on_command_fail", on_fail_callbacks :: any, ctx, reason)
	return ctx
end

local function call_guard(ctx: types.ExecutionContext, name: string, callback: (ctx: types.ExecutionContext) -> boolean)
	local result, value = xpcall(callback :: any, log.capture, ctx)
	if not result then
		local caught: log.CaughtError = value
		log.error(`Guard execution failed for '{name}': {caught.message}`, {
			executor = ctx.executor,
			command = ctx.command,
			input = ctx.input,
			guard = name,
			traceback = caught.traceback,
		})
		ctx.error("Failed to execute command.")
		return false
	end

	if value == true then
		return true
	end

	if value ~= false then
		log.warn(`Guard '{name}' returned {typeof(value)} instead of a boolean. Did you forget to return true?`, {
			executor = ctx.executor,
			command = ctx.command,
			input = ctx.input,
			guard = name,
		})
	end

	if not ctx.response then
		ctx.error("You cannot execute this command.")
	end

	return false
end

local function check_access(ctx: types.ExecutionContext, command: types.Command<unknown>?): types.FailReason?
	if command == nil or commands[ctx.command] ~= command then
		ctx.error("Unknown command")
		return "unknown"
	end

	if not permission.can_execute(ctx.executor, command) then
		if permission.options.hide then
			ctx.error("Unknown command")
		else
			ctx.error("You do not have permission to execute this command.")
		end

		return "permission"
	end

	return nil
end

-- `input` is the raw, untokenized string the executor submitted. Pass it
-- whenever it's available so that `ctx.input` keeps the original quoting.
local function execute(executor: Player, name: string, args: { string }?, input: string?): types.ExecutionContext
	args = args or {}
	local ctx = context(executor, name, args, input)

	local command = commands[name]
	local denied: types.FailReason? = check_access(ctx, command)
	if denied then
		return fail(ctx, denied)
	end

	if not command.callback then
		assert(network_handler, "Network handler must be set before server command execution on the client.")
		return network_handler(name, args, input)
	end

	-- clone so that a guard removing itself (or another global
	-- guard) mid-loop can't cause the next one to be skipped
	for i, v in table.clone(guard.global_guards) do
		if not call_guard(ctx, `global guard #{i}`, v) then
			return fail(ctx, "guard")
		end
	end

	if command.guards then
		for i, cmd_guard in command.guards do
			if type(cmd_guard) ~= "string" then
				if not call_guard(ctx, `guard #{i}`, cmd_guard :: types.Guard) then
					return fail(ctx, "guard")
				end
				continue
			end

			-- registration checks that named guards exist, but one can be
			-- unregistered afterwards. fail closed rather than skip it
			local guard_callback = guard.guards[cmd_guard]
			if not guard_callback then
				log.warn(`Guard '{cmd_guard}' used by command '{name}' is not registered.`, {
					executor = executor,
					command = name,
					input = ctx.input,
					guard = cmd_guard,
				})
				ctx.error("Failed to execute command.")
				return fail(ctx, "guard")
			end

			if not call_guard(ctx, cmd_guard, guard_callback) then
				return fail(ctx, "guard")
			end
		end
	end

	-- always transform, even with no declared arguments, so that commands
	-- taking none still reject extra input
	local command_args: { types.Argument } = if command.arguments
		then { command.arguments() } :: { types.Argument }
		else {}

	-- transforms are user code too, so a throwing one is handled like a
	-- throwing guard or callback rather than escaping to the network handler
	local transformed, res = xpcall(argument.transform :: any, log.capture, executor, args, command_args)
	if not transformed then
		local caught: log.CaughtError = res
		log.error(`Failed to transform arguments for '{ctx.input}': {caught.message}`, {
			executor = executor,
			command = name,
			input = ctx.input,
			traceback = caught.traceback,
		})
		ctx.error("Failed to execute command.")
		return fail(ctx, "arguments")
	end

	if not res.success then
		ctx.error(res.error)
		return fail(ctx, "arguments")
	end

	-- guards and transforms can yield, so the executor's roles may have been revoked,
	-- or the command replaced, since the previous check
	denied = check_access(ctx, command)
	if denied then
		return fail(ctx, denied)
	end

	-- unpack up to the declared argument count so that omitted optional
	-- arguments don't truncate the ones after them
	local success, value = xpcall(command.callback :: any, log.capture, ctx, unpack(res.value, 1, #command_args))
	if not success then
		local caught: log.CaughtError = value
		log.error(`Failed to execute '{ctx.input}': {caught.message}`, {
			executor = executor,
			command = name,
			input = ctx.input,
			traceback = caught.traceback,
		})
		ctx.error("Failed to execute command.")
		return fail(ctx, "callback")
	end

	if type(value) == "string" then
		ctx.reply(value)
	end

	notify("on_command_execute", on_execute_callbacks :: any, ctx)
	return ctx
end

local function check_arity(name: string, callback: (...any) -> any, declared: number, offset: number)
	local nparams, is_vararg = debug.info(callback, "a")

	if is_vararg or nparams == 0 then
		return
	end

	local takes = (nparams :: number) - offset
	if takes ~= declared then
		log.warn(
			`Command '{name}' declares {declared} {declared == 1 and "argument" or "arguments"} but its callback takes {takes}.`,
			{ command = name }
		)
	end
end

local function validate_command(name: string, command: types.Command<unknown>)
	local args: { types.Argument } = command.arguments and { command.arguments() } :: { types.Argument } or {}

	if command.guards then
		for _, cmd_guard in command.guards do
			if type(cmd_guard) == "string" then
				assert(guard.guards[cmd_guard], `Guard '{cmd_guard}' used by command '{name}' is not registered.`)
			end
		end
	end

	local has_roles = command.roles ~= nil and #command.roles > 0
	local has_permissions = command.permissions ~= nil and #command.permissions > 0

	-- roles only exist on the server, so a restricted command registered on the
	-- client could never pass can_execute. synced commands have these stripped
	if (has_roles or has_permissions) and services.RunService:IsRunning() and not services.RunService:IsServer() then
		error(
			`Command '{name}' restricts roles or permissions, which are only checked on the server. Register it on the server instead.`
		)
	end

	if command.roles then
		for _, role_name in command.roles do
			assert(permission.roles[role_name], `Role '{role_name}' used by command '{name}' is not registered.`)
		end
	end

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

	for _, v in names do
		assert(commands[v] == nil, "Command with name '" .. v .. "' is already registered.")
	end

	for _, v in names do
		commands[v] = command :: any
	end

	-- once per name, so listeners see every alias
	for _, v in names do
		for _, callback in table.clone(on_register_callbacks) do
			callback(v, command :: types.Command<unknown>)
		end
	end
end

local function command<T...>(name: string | { string }, definition: types.CommandDefinition<T...>): types.CommandBuilder<T...>
	return {
		callback = function(_self, callback)
			local cmd = table.clone(definition) :: any
			cmd.callback = callback
			register(name, cmd :: types.Command<T...>)
		end,
	}
end

local function unregister(name: string)
	assert(commands[name] ~= nil, "Command with name '" .. name .. "' is not registered.")

	local cmd_definition = commands[name]

	-- unregistering any name removes the command's aliases too
	local names: { string } = {}
	for k, v in commands do
		if cmd_definition == v then
			table.insert(names, k)
		end
	end
	table.sort(names)

	for _, v in names do
		commands[v] = nil
	end

	for _, v in names do
		for _, callback in table.clone(on_unregister_callbacks) do
			callback(v, cmd_definition :: types.Command<unknown>)
		end
	end
end

local function on_register(callback: RegisterCallback)
	table.insert(on_register_callbacks, callback)

	return function()
		local index = table.find(on_register_callbacks, callback)
		if index then
			table.remove(on_register_callbacks, index)
		end
	end
end

local function on_unregister(callback: RegisterCallback)
	table.insert(on_unregister_callbacks, callback)

	return function()
		local index = table.find(on_unregister_callbacks, callback)
		if index then
			table.remove(on_unregister_callbacks, index)
		end
	end
end

local function on_execute(callback: (ctx: types.ExecutionContext) -> ())
	table.insert(on_execute_callbacks, callback)

	return function()
		local index = table.find(on_execute_callbacks, callback)
		if index then
			table.remove(on_execute_callbacks, index)
		end
	end
end

local function on_fail(callback: (ctx: types.ExecutionContext, reason: types.FailReason) -> ())
	table.insert(on_fail_callbacks, callback)

	return function()
		local index = table.find(on_fail_callbacks, callback)
		if index then
			table.remove(on_fail_callbacks, index)
		end
	end
end

return {
	set_network_handler = set_network_handler,
	execute = execute,
	register = register,
	command = command,
	unregister = unregister,
	on_register = on_register,
	on_unregister = on_unregister,
	on_execute = on_execute,
	on_fail = on_fail,
	commands = commands,
	check_arity = check_arity,
}
