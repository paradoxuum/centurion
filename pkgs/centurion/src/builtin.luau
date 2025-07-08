local argument = require("./argument")
local result = require("./result")
local types = require("./types")

local register = argument.register

local function register_types()
	register("string", {
		transform = function(value: string)
			return result.success(value)
		end,
	})

	register("number", {
		transform = function(value: string): types.Result
			local num = tonumber(value)
			if num == nil then
				return result.error(`Invalid number: {value}`)
			end
			return result.success(num)
		end,
	})

	register("integer", {
		transform = function(value: string): types.Result
			local num = tonumber(value)
			if num == nil or math.floor(num) ~= num then
				return result.error(`Invalid integer: {value}`)
			end
			return result.success(num)
		end,
	})

	local boolean = {
		["true"] = true,
		["false"] = false,
		yes = true,
		no = false,
		y = true,
		n = false,
	}

	local boolean_suggestions = {}
	for key in pairs(boolean) do
		table.insert(boolean_suggestions, key)
	end

	register("boolean", {
		transform = function(value: string): types.Result
			local bool = boolean[value:lower()]
			if bool == nil then
				return result.error(`Invalid boolean: {value}`)
			end
			return result.success(bool)
		end,
		suggestions = function(): { string }
			return boolean_suggestions
		end,
	})
end

return {
	register_types = register_types,
}
