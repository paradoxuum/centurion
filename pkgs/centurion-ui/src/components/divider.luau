local fade = require("../fade")
local state = require("../state")
local theme = require("../theme")
local vide = require("../../vide")

local create = vide.create

type Can<T> = T | () -> T
type Divider = {
	read order: Can<number>?,
	read visible: Can<boolean>?,
}

-- a 1px horizontal rule. It has no width of its own and relies on the parent's
-- list layout filling it horizontally: a scale width would make an
-- automatically sized parent grow to fill its own parent
return function(props: Divider?)
	return create "Frame" {
		Size = UDim2.fromOffset(0, 1),
		BackgroundColor3 = function()
			return theme.border(state.theme())
		end,
		BackgroundTransparency = fade.fade(),
		BorderSizePixel = 0,
		LayoutOrder = props and props.order,
		Visible = props and props.visible,
	}
end
