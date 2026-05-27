local argument = require("./.")
local result = require("../result")
local types = require("../types")

local vector2 = argument.register_list_type(
	"vector2",
	{
		transform = function(text: { string }, _executor: Player)
			if #text ~= 2 then
				return result.error("Vector must have 2 components.")
			end

			local x = tonumber(text[1])
			local y = tonumber(text[2])

			if not x or not y then
				return result.error("All vector components must be valid numbers.")
			end
			return result.success(Vector2.new(x, y))
		end,
	} :: types.ListArgumentType
)

local vector3 = argument.register_list_type(
	"vector3",
	{
		transform = function(text: { string }, _executor: Player)
			if #text ~= 3 then
				return result.error("Vector must have 3 components.")
			end

			local x = tonumber(text[1])
			local y = tonumber(text[2])
			local z = tonumber(text[3])

			if not x or not y or not z then
				return result.error("All vector components must be valid numbers.")
			end
			return result.success(vector.create(x, y, z))
		end,
	} :: types.ListArgumentType
)

return {
	vector2 = vector2 :: types.ArgumentFn<Vector2>,
	vector3 = vector3 :: types.ArgumentFn<vector>,
}
