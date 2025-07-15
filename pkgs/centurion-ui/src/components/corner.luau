local create = require("../create")
local vide = require("../../vide")

return function(px: number)
	return create "UICorner" {
		CornerRadius = function()
			return UDim.new(0, vide.read(px))
		end,
	}
end
