local argument = require("./.")
local result = require("../result")
local types = require("../types")

local register = argument.register_type

local str = register("string", {
	transform = function(value: string): types.Result<string>
		return result.success(value)
	end,
})

local number = register("number", {
	transform = function(value: string): types.Result<number>
		local num = tonumber(value)
		if num == nil then
			return result.error(`Invalid number: {value}`)
		end
		return result.success(num)
	end,
})

local int = register("integer", {
	transform = function(value: string): types.Result<number>
		local num = tonumber(value)
		if num == nil or math.floor(num) ~= num then
			return result.error(`Invalid integer: {value}`)
		end
		return result.success(num)
	end,
})

local bool_dict = {
	["true"] = true,
	["false"] = false,
	yes = true,
	ye = true,
	no = false,
	y = true,
	n = false,
}

local bool = register("boolean", {
	transform = function(value: string): types.Result<boolean>
		local bool_val = bool_dict[value:lower()]
		if bool_val == nil then
			return result.error(`Invalid boolean: {value}`)
		end
		return result.success(bool_val)
	end,
})

return {
	string = str,
	number = number,
	integer = int,
	boolean = bool,
}
