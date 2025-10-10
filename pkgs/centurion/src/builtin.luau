--!nonstrict

local argument = require("./argument")
local result = require("./result")
local types = require("./types")

local register = argument.register

local str = register("string", {
	transform = function(value: string)
		return result.success(value)
	end,
})

local number = register("number", {
	transform = function(value: string)
		local num = tonumber(value)
		if num == nil then
			return result.error(`Invalid number: {value}`)
		end
		return result.success(num)
	end,
})

local int = register("integer", {
	transform = function(value: string)
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
	transform = function(value: string): types.Result
		local bool_val = bool_dict[value:lower()]
		if bool_val == nil then
			return result.error(`Invalid boolean: {bool_val}`)
		end
		return result.success(bool_val)
	end,
})

type Arg<T> = argument.ArgumentFn<T>

return {
	types = {
		string = str :: Arg<string>,
		number = number :: Arg<number>,
		integer = int :: Arg<number>,
		boolean = bool :: Arg<boolean>,
	},
}
