local vide = require("../../vide")

local create = vide.create

type Can<T> = T | () -> T
type Background = {
	read size: Can<UDim2>?,
	read position: Can<UDim2>?,
	read anchor: Can<Vector2>?,
	read color: Can<Color3>?,
	read zindex: Can<number>?,
	read auto: Can<Enum.AutomaticSize | "X" | "Y" | "XY">?,
	read order: Can<number>?,
	read transparency: Can<number>?,
	read visible: Can<boolean>?,

	[number]: unknown,
}

return function(props: Background)
	return create "Frame" {
		Size = props.size,
		BackgroundColor3 = props.color,
		BackgroundTransparency = props.transparency,
		Position = props.position,
		AnchorPoint = props.anchor,
		AutomaticSize = props.auto,
		LayoutOrder = props.order,
		ZIndex = props.zindex,
		Visible = props.visible,

		AutoLocalize = false,

		unpack(props),
	}
end
