local fluid = require("../../fluid")

local create = fluid.create

return function(px: number)
	return create "UICorner" {
		CornerRadius = function()
			return UDim.new(0, fluid.read(px))
		end,
	}
end
