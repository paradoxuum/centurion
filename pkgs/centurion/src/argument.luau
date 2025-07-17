local result = require("./result")
local types = require("./types")

local arg_types = {}

local function register(name: string, type: types.ArgumentType)
	assert(arg_types[name] == nil, "Argument type with name '" .. name .. "' already exists.")

	arg_types[name] = type
end

local function enum(values: { string }): types.ArgumentType
	return {
		transform = function(value: string): types.Result
			if not table.find(values, value) then
				return result.error(`Invalid value '{value}'. Valid values are: {table.concat(values, ", ")}`)
			end
			return result.success(value)
		end,
		suggestions = function()
			return values
		end,
	}
end

local function transform(executor: Player, input: { string }, args: { types.Argument }): types.Result
	local transformed_args: { unknown } = {}

	local input_index = 1
	for i, arg in args do
		local num_args = arg.num_args or 1

		local arg_inputs = {}

		local end_num = input_index
		if num_args == "rest" or i == #args then
			end_num = #input
		else
			end_num = input_index + num_args - 1
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

		if type(num_args) == "number" and #arg_inputs ~= num_args then
			return {
				success = false,
				error = `Expected {num_args} arguments for {arg.name}, got {#arg_inputs}`,
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

		transformed_args[i] = num_args == 1 and values[1] or values
	end

	return result.success(transformed_args)
end

return {
	register = register,
	enum = enum,
	transform = transform,
	types = arg_types,
}
