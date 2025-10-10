local vide = require("../../vide")

local create = vide.create

type Can<T> = T | () -> T
type Container = {
	read size: Can<UDim2>?,
	read position: Can<UDim2>?,
	read anchor: Can<Vector2>?,
	read zindex: Can<number>?,
	read auto: Can<Enum.AutomaticSize | "X" | "Y" | "XY">?,
	read order: Can<number>?,

	[number]: unknown,
}

return function(props: Container)
	return create "Frame" {
		Size = props.size,
		Position = props.position,
		AnchorPoint = props.anchor,
		AutomaticSize = props.auto,
		LayoutOrder = props.order,
		ZIndex = props.zindex,

		AutoLocalize = false,
		BackgroundTransparency = 1,

		unpack(props),
	}
end
