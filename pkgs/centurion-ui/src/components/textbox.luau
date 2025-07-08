local fluid = require("../../fluid")
local state = require("../state")

local create = fluid.create
local cleanup = fluid.cleanup
local source = fluid.source
local effect = fluid.effect
local read = fluid.read :: (<T>(() -> T) -> T) & (<T>(T) -> T)

type Can<T> = T | () -> T
type Background = {
	read width: Can<number>?,
	read height: Can<number>?,

	read text: Can<string>,
	read text_size: Can<number>?,
	read text_color: Can<Color3>?,
	read placeholder: Can<string>?,
	read focused: Can<boolean>?,
	read xalignment: Can<Enum.TextXAlignment>?,
	read multiline: Can<boolean>?,
	read editable: Can<boolean>?,

	read update_text: ((string) -> ())?,
	read update_focused: ((boolean) -> ())?,
	read enter: (string) -> (),

	[number]: unknown,
}

return function(props: Background)
	local raw_text = source ""
	local textbox: TextBox = create "TextBox" {
		Size = function()
			return UDim2.fromOffset(read(props.width) or 0, read(props.height) or 0)
		end,
		AutomaticSize = Enum.AutomaticSize.XY,

		Text = props.text,
		PlaceholderText = props.placeholder,
		TextSize = props.text_size or 16,
		TextColor3 = props.text_color,
		TextXAlignment = props.xalignment,
		MultiLine = props.multiline,
		FontFace = state.theme.font,

		BackgroundTransparency = 1,

		Focused = function()
			if not props.update_focused then
				return
			end
			props.update_focused(true)
		end,

		FocusLost = function(enter)
			if props.update_focused then
				props.update_focused(false)
			end
			if not enter then
				return
			end
			if not props.focused then
				return
			end
			props.enter(raw_text())
		end,

		unpack(props),
	}

	local connection = textbox:GetPropertyChangedSignal("Text"):Connect(function()
		if props.update_text then
			props.update_text(textbox.Text)
		end
		raw_text(textbox.Text)
	end)

	cleanup(function()
		connection:Disconnect()
	end)

	effect(function()
		local value = read(props.focused)
		if textbox:IsFocused() == value then
			return
		end
		task.defer(function()
			if value then
				textbox:CaptureFocus()
			else
				textbox:ReleaseFocus(false)
			end
		end)
	end)

	return textbox
end
