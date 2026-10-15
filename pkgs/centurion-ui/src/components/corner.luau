local vide = require("../../vide")

local create = vide.create

return function(px: number)
	return create "UICorner" {
		CornerRadius = function()
			return UDim.new(0, vide.read(px))
		end,
	}
end
