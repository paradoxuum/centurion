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
			num_args = 1,
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
			return result.error(`Invalid value '{value}'. Valid values are: {table.concat(values, ", ")}`)
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

local function num_args<T>(argument: T, num: number | "rest"): { T }
	local arg = argument :: types.Argument
	arg.num_args = num
	return arg :: { T }
end

local function optional<T>(argument: T): T | nil
	local arg = argument :: types.Argument
	arg.optional = true
	return arg
end

local function transform(executor: Player, input: { string }, args: { types.Argument }): types.Result<{ unknown }>
	local transformed_args: { unknown } = {}

	local input_index = 1
	for i, arg in args do
		local n_args = arg.num_args or 1

		local arg_type = arg_types[arg.type]
		assert(arg_type, `Argument type '{arg.type}' is not registered`)

		-- only "rest" consumes the remaining input, every other argument takes
		-- exactly the number of values it asks for
		local end_num = if n_args == "rest" then #input else input_index + n_args - 1

		local arg_inputs = {}
		for j = input_index, math.min(end_num, #input) do
			table.insert(arg_inputs, input[j])
			input_index += 1
		end

		if #arg_inputs == 0 then
			if arg.optional then
				continue
			end

			return result.error(`Missing required argument: {arg.name}`)
		end

		local values: { unknown } = {}
		for j = 1, #arg_inputs do
			local parsed_input = parse(arg_inputs[j], arg_type.kind == "single" and " " or ",")
			local parsed_text = {}
			for _, token in parsed_input.tokens do
				table.insert(parsed_text, token.text)
			end

			local res: types.Result<unknown>
			if arg_type.kind == "single" then
				res = arg_type.transform(parsed_text[1], executor)
			else
				res = arg_type.transform(parsed_text, executor)
			end

			if not res.success then
				local at = if #arg_inputs > 1 then ` #{j}` else ""
				return result.error(`Invalid value{at} for '{arg.name}': {res.error}`)
			end
			values[j] = res.value
		end

		if type(n_args) == "number" and #arg_inputs ~= n_args then
			return result.error(
				`Expected {n_args} {n_args == 1 and "value" or "values"} for '{arg.name}', got {#arg_inputs}`
			)
		end

		if n_args == 1 then
			transformed_args[i] = values[1]
		else
			transformed_args[i] = values
		end
	end

	if input_index <= #input then
		local expected = input_index - 1
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
	transform = transform,
	types = arg_types,
}
