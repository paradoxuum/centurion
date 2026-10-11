local fade = require("../fade")
local vide = require("../../vide")

local create = vide.create

type Can<T> = T | () -> T
type Image = {
	read image: Can<string>,
	read size: Can<UDim2>?,
	read color: Can<Color3>?,
	read transparency: Can<number>?,
	read order: Can<number>?,
	read visible: Can<boolean>?,

	[number]: unknown,
}

return function(props: Image)
	return create "ImageLabel" {
		Image = props.image,
		Size = props.size,
		ImageColor3 = props.color,
		ImageTransparency = fade.fade(props.transparency),
		LayoutOrder = props.order,
		Visible = props.visible,
		ScaleType = Enum.ScaleType.Fit,

		AutoLocalize = false,
		BackgroundTransparency = 1,

		unpack(props),
	}
end
