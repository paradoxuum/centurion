local px = require("../px")
local state = require("../state")
local theme = require("../theme")
local types = require("../types")
local vide = require("../../vide")

local create = vide.create
local read = vide.read :: (<T>(() -> T) -> T) & (<T>(T) -> T)

type Can<T> = T | () -> T
type Background = {
	read size: Can<UDim2>?,
	read auto: Can<Enum.AutomaticSize | "X" | "Y" | "XY">?,
	read order: Can<number>?,

	read text: Can<string>,
	read weight: Can<Enum.FontWeight>?,
	read text_size: Can<number>?,
	read text_style: Can<types.TextStyle>?,
	read xalignment: Can<Enum.TextXAlignment>?,
	read wrapped: Can<boolean>?,
	read rich_text: Can<boolean>?,

	[number]: unknown,
}

return function(props: Background)
	return create "TextLabel" {
		Size = props.size,
		AutomaticSize = props.auto,
		LayoutOrder = props.order,

		Text = props.text,
		TextSize = props.text_size or px(state.text_size),
		TextColor3 = function()
			return theme.text_color(state.theme(), props.text_style and read(props.text_style) or "normal")
		end,
		FontFace = function()
			local f: Font = state.font()
			local weight = read(props.weight) or Enum.FontWeight.Regular
			return Font.new(f.Family, weight)
		end,
		TextWrapped = props.wrapped,
		TextXAlignment = props.xalignment,
		RichText = props.rich_text,

		AutoLocalize = false,
		BackgroundTransparency = 1,

		unpack(props),
	}
end
