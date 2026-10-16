local parse = require("./parse")
local result = require("./result")
local types = require("./types")

local arg_types: { [string]: types.ArgumentType<unknown> } = {}

-- the declarator returns an `Argument`, but it is typed as the transformed
-- value so that a command's `arguments()` tuple types its callback parameters
local function declarator<T>(type_name: string): types.ArgumentFn<T>
	local function create(name: string, description: string?, suggestions: { string }?): types.Argument
		return {
			name = name,
			description = description,
			type = type_name,
			optional = false,
			suggestions = suggestions,
		}
	end

	return (create :: any) :: types.ArgumentFn<T>
end

local function register_type<T>(
	type_name: string,
	data: {
		transform: (text: string, executor: Player) -> types.Result<T>,
		suggestions: ((text: string, executor: Player) -> { string })?,
	}
): types.ArgumentFn<T>
	assert(arg_types[type_name] == nil, `Argument type '{type_name}' is already registered.`)

	arg_types[type_name] = {
		kind = "single",
		transform = data.transform,
		suggestions = data.suggestions,
	} :: types.SingleArgumentType<T>

	return declarator(type_name)
end

local function register_list_type<T>(
	type_name: string,
	data: {
		transform: (text: { string }, executor: Player) -> types.Result<T>,
		suggestions: ((text: string, executor: Player) -> { string })?,
	}
): types.ArgumentFn<T>
	assert(arg_types[type_name] == nil, `Argument type '{type_name}' is already registered.`)

	arg_types[type_name] = {
		kind = "list",
		transform = data.transform,
		suggestions = data.suggestions,
	} :: types.ListArgumentType<T>

	return declarator(type_name)
end

local function enum(values: { string })
	local transform = function(value: string): types.Result<string>
		if not table.find(values, value) then
			return result.error(`'{value}' is not a valid option`)
		end
		return result.success(value)
	end

	local suggestions = function()
		return values
	end

	return {
		transform = transform,
		suggestions = suggestions,
	}
end

-- `num_args` and `rest` are typed as `{ T }` so the callback receives an array.
-- that holds at runtime because any argument with `num_args` set, even to 1, is
-- passed as an array; only arguments without it are passed as a single value
local function num_args<T>(argument: T, num: number): { T }
	local arg = table.clone(argument :: types.Argument)
	arg.num_args = num
	return arg :: { T }
end

local function rest<T>(argument: T): { T }
	local arg = table.clone(argument :: types.Argument)
	arg.num_args = "rest"
	return arg :: { T }
end

local function optional<T>(argument: T): T | nil
	local arg = table.clone(argument :: types.Argument)
	arg.optional = true
	return arg
end

export type ArgumentRange = {
	first: number,
	last: number,
}

local function assign(args: { types.Argument }, count: number): ({ ArgumentRange }, number)
	local ranges: { ArgumentRange } = {}

	local index = 1
	for i, arg in args do
		local n_args = arg.num_args or 1
		local last = math.min(if n_args == "rest" then count else index + n_args - 1, count)

		ranges[i] = { first = index, last = last }
		index = math.max(index, last + 1)
	end

	return ranges, index
end

local function transform_value(executor: Player, arg: types.Argument, raw: string): types.Result<unknown>
	local arg_type = arg_types[arg.type]
	assert(arg_type, `Argument type '{arg.type}' is not registered`)

	local parsed_text = {}
	for _, token in parse(raw, arg_type.kind == "single" and " " or ",").tokens do
		table.insert(parsed_text, token.text)
	end

	if arg_type.kind == "single" then
		return arg_type.transform(parsed_text[1], executor)
	end

	return arg_type.transform(parsed_text, executor)
end

local function transform(executor: Player, input: { string }, args: { types.Argument }): types.Result<{ unknown }>
	local transformed_args: { unknown } = {}
	local ranges, next_index = assign(args, #input)

	for i, arg in args do
		local n_args = arg.num_args or 1
		local range = ranges[i]
		local count = range.last - range.first + 1

		if count <= 0 then
			if arg.optional then
				continue
			end

			return result.error(`Missing required argument: {arg.name}`)
		end

		local values: { unknown } = {}
		for j = range.first, range.last do
			local res = transform_value(executor, arg, input[j])
			if not res.success then
				local at = if count > 1 then ` #{j - range.first + 1}` else ""
				return result.error(`Invalid value{at} for '{arg.name}': {res.error}`)
			end
			values[j - range.first + 1] = res.value
		end

		if type(n_args) == "number" and count ~= n_args then
			return result.error(`Expected {n_args} {n_args == 1 and "value" or "values"} for '{arg.name}', got {count}`)
		end

		if arg.num_args == nil then
			transformed_args[i] = values[1]
		else
			transformed_args[i] = values
		end
	end

	if next_index <= #input then
		local expected = next_index - 1
		if expected == 0 then
			return result.error(`Expected no arguments, got {#input}`)
		end

		return result.error(`Expected at most {expected} {expected == 1 and "argument" or "arguments"}, got {#input}`)
	end

	return result.success(transformed_args)
end

return {
	register_type = register_type,
	register_list_type = register_list_type,
	enum = enum,
	optional = optional,
	num_args = num_args,
	rest = rest,
	assign = assign,
	transform_value = transform_value,
	transform = transform,
	types = arg_types,
}
