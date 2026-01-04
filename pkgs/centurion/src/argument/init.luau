local parse = require("./parse")
local result = require("./result")
local types = require("./types")

local arg_types: { [string]: types.ArgumentType } = {}

local function register_type<T>(
	type_name: string,
	data: {
		transform: (text: string, executor: Player) -> types.Result,
		suggestions: ((text: string, executor: Player) -> { string })?,
	}
)
	arg_types[type_name] = {
		kind = "single",
		transform = data.transform,
		suggestions = data.suggestions,
	} :: types.ArgumentType

	return function(name: string, description: string?, suggestions: { string }?): T
		return {
			name = name,
			description = description,
			type = type_name,
			optional = false,
			num_args = 1,
			suggestions = suggestions,
		} :: types.Argument
	end
end

local function register_list_type<T>(
	type_name: string,
	data: {
		transform: (text: { string }, executor: Player) -> types.Result,
		suggestions: ((text: string, executor: Player) -> { string })?,
	}
)
	arg_types[type_name] = {
		kind = "list",
		transform = data.transform,
		suggestions = data.suggestions,
	} :: types.ArgumentType

	return function(name: string, description: string?, suggestions: { string }?): T
		return {
			name = name,
			description = description,
			type = type_name,
			optional = false,
			num_args = 1,
			suggestions = suggestions,
		} :: types.Argument
	end
end

local function enum(values: { string })
	local transform = function(value: string): types.Result
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

local function transform(executor: Player, input: { string }, args: { types.Argument }): types.Result
	local transformed_args: { unknown } = {}

	local input_index = 1
	for i, arg in args do
		local n_args = arg.num_args or 1

		local arg_inputs = {}

		local end_num = input_index
		if n_args == "rest" or i == #args then
			end_num = #input
		else
			end_num = input_index + n_args - 1
		end

		for j = input_index, end_num do
			table.insert(arg_inputs, input[j])
			input_index += 1
		end

		if #arg_inputs == 0 then
			if arg.optional then
				break
			end

			return {
				success = false,
				error = `Missing required argument: {arg.name}`,
			}
		end

		local values: { unknown } = {}
		for j = 1, #arg_inputs do
			local arg_type = arg_types[arg.type]
			assert(arg_type, `Argument type '{arg.type}' is not registered`)

			local parsed_input = parse(arg_inputs[j], arg_type.kind == "single" and " " or ",")
			local parsed_text = {}
			for _, token in parsed_input.tokens do
				table.insert(parsed_text, token.text)
			end

			local res: types.Result
			if arg_type.kind == "single" then
				res = arg_type.transform(parsed_text[1], executor)
			else
				res = arg_type.transform(parsed_text, executor)
			end

			if not res.success then
				return result.error(`[arg #{j}] {res.error}`)
			end
			values[j] = res.value
		end

		if type(n_args) == "number" and #arg_inputs ~= n_args then
			return {
				success = false,
				error = `Expected {n_args} arguments for {arg.name}, got {#arg_inputs}`,
			}
		end

		transformed_args[i] = n_args == 1 and values[1] or values
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
