local result = require("./result")
local types = require("./types")

local arg_types: { [string]: types.ArgumentType } = {}

export type ArgumentFn<T> = (name: string, description: string?, suggestions: { string }?) -> T

local function register<T>(type_name: string, data: types.ArgumentType)
	arg_types[type_name] = data

	return function(
		name: string,
		description: string?,
		metadata: {
			suggestions: { string }?,
			num_args: number | "rest"?,
			optional: boolean?,
		}?
	): T
		return {
			name = name,
			description = description,
			type = type_name,
			optional = metadata and metadata.optional or false,
			num_args = metadata and metadata.num_args or 1,
			suggestions = metadata and metadata.suggestions or nil,
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

local function num_args<T>(argument: T, num: number | "rest"): T
	local arg = argument :: types.Argument
	arg.num_args = num
	return arg
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

		if type(n_args) == "number" and #arg_inputs ~= n_args then
			return {
				success = false,
				error = `Expected {n_args} arguments for {arg.name}, got {#arg_inputs}`,
			}
		end

		local values: { unknown } = {}
		for j = 1, #arg_inputs do
			local arg_type = arg_types[arg.type]
			assert(arg_type, `Argument type '{arg.type}' is not registered`)

			local res = arg_type.transform(arg_inputs[j], executor)
			if not res.success then
				return result.error(`[arg #{j}] {res.error}`)
			end
			values[j] = res.value
		end

		transformed_args[i] = n_args == 1 and values[1] or values
	end

	return result.success(transformed_args)
end

return {
	register = register,
	enum = enum,
	optional = optional,
	num_args = num_args,
	transform = transform,
	types = arg_types,
}
