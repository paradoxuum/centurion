local fade = require("../fade")
local px = require("../px")
local vide = require("../../vide")

local create = vide.create

type Can<T> = T | () -> T
type Stroke = {
	read color: Can<Color3>?,
	read thickness: Can<number>?,
	read transparency: Can<number>?,
}

return function(props: Stroke)
	return create "UIStroke" {
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
		Color = props.color,
		Thickness = px(props.thickness or 1),
		Transparency = fade.fade(props.transparency),
	}
end
