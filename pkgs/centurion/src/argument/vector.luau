local argument = require("./.")
local result = require("../result")
local types = require("../types")

local vector = argument.register_list_type(
	"vector",
	{
		transform = function(text: { string }, _executor: Player)
			if #text < 2 or #text > 3 then
				return result.error("Vector must have 2 or 3 components.")
			end

			local x = tonumber(text[1])
			local y = tonumber(text[2])
			local z = text[3] and tonumber(text[3])

			if not x or not y or (text[3] and not z) then
				return result.error("All vector components must be valid numbers.")
			end
			return result.success(vector.create(x, y, z or 0))
		end,
	} :: types.ListArgumentType
)

return vector :: types.ArgumentFn<vector>
