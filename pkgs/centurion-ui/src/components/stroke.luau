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
		Thickness = props.thickness or 1,
		Transparency = props.transparency,
	}
end
