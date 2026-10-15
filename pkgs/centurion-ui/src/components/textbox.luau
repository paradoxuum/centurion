local GuiService = game:GetService("GuiService")
local UserInputService = game:GetService("UserInputService")

local fade = require("../fade")
local px = require("../px")
local state = require("../state")
local theme = require("../theme")
local types = require("../types")
local vide = require("../../vide")

local create = vide.create
local changed = vide.changed
local source = vide.source
local effect = vide.effect
local read = vide.read :: (<T>(() -> T) -> T) & (<T>(T) -> T)

type Can<T> = T | () -> T
type TextBoxProps = {
	read width: Can<number>?,
	read height: Can<number>?,

	read text: Can<string>,
	read text_size: Can<number>?,
	read text_style: Can<types.TextStyle>?,
	read wrapped: Can<boolean>?,
	read weight: Can<Enum.FontWeight>?,
	read rich_text: Can<boolean>?,
	read background_color: Can<Color3>?,
	read background_transparency: Can<number>?,
	read placeholder: Can<string>?,
	read focused: Can<boolean>?,
	read xalignment: Can<Enum.TextXAlignment>?,
	read multiline: Can<boolean>?,
	read editable: Can<boolean>?,
	read transparency: Can<number>?,
	-- whether confirming the console keyboard submits, rather than only committing the text
	read submit_on_keyboard_return: boolean?,
	-- receives a function that opens the keyboard, even if the textbox is already focused without it
	read bind_open_keyboard: ((open: () -> ()) -> ())?,

	read update_text: ((string) -> ())?,
	read update_focused: ((boolean) -> ())?,
	read enter: (string) -> (),

	[number]: unknown,
}

return function(props: TextBoxProps)
	local raw_text = source ""
	-- set while focus is briefly released to reopen the touch keyboard
	local reattaching = false

	local function submit()
		if not props.focused then
			return
		end
		props.enter(raw_text())
	end

	local textbox: TextBox
	textbox = create "TextBox" {
		Size = function()
			return UDim2.fromOffset(read(props.width) or 0, read(props.height) or 0)
		end,
		AutomaticSize = Enum.AutomaticSize.XY,

		Text = props.text,
		PlaceholderText = props.placeholder,
		TextSize = props.text_size or px(state.text_size),
		TextTransparency = fade.fade(props.transparency),
		TextColor3 = function()
			return theme.text_color(state.theme(), props.text_style and read(props.text_style) or "normal")
		end,
		TextXAlignment = props.xalignment,
		TextEditable = props.editable,
		TextWrapped = props.wrapped,
		MultiLine = props.multiline,
		FontFace = function()
			local f: Font = state.font()
			local weight = read(props.weight) or Enum.FontWeight.Regular
			return Font.new(f.Family, weight)
		end,
		RichText = props.rich_text,
		PlaceholderColor3 = function()
			return state.theme().subtext
		end,

		BackgroundColor3 = props.background_color,
		BackgroundTransparency = props.background_transparency or 1,
		AutoLocalize = false,

		if props.update_text then changed("Text", props.update_text) else nil,
		changed("Text", raw_text),

		Focused = function()
			if not props.update_focused then
				return
			end
			props.update_focused(true)
		end,

		FocusLost = function(enter)
			if reattaching then
				return
			end
			if props.update_focused then
				props.update_focused(false)
			end
			if not enter then
				return
			end
			submit()
		end,

		-- consoles don't fire enter through FocusLost, so this workaround is required
		-- Roblox have shown some interest in fixing this, so it should be removed in that case to prevent duplicate submissions
		ReturnPressedFromOnScreenKeyboard = if GuiService:IsTenFootInterface()
			then function()
				if props.submit_on_keyboard_return ~= false then
					submit()
				else
					-- the textbox can stay focused once the keyboard closes, so release it explicitly
					textbox:ReleaseFocus(false)
				end
			end
			else nil,

		unpack(props),
	}

	-- releases focus without reporting it, so that it can be captured again
	local function detach()
		reattaching = true
		textbox:ReleaseFocus(false)
		task.wait()
		reattaching = false
	end

	local function capture()
		if textbox:IsFocused() then
			-- tapping a button on touch devices can leave the textbox focused
			-- without the keyboard open, so release it and capture it again
			if
				UserInputService.OnScreenKeyboardVisible
				or UserInputService.PreferredInput ~= Enum.PreferredInput.Touch
			then
				return
			end

			detach()
		end

		if read(props.focused) then
			textbox:CaptureFocus()
		end
	end

	if props.bind_open_keyboard then
		props.bind_open_keyboard(function()
			task.defer(function()
				if textbox:IsFocused() then
					detach()
				end
				textbox:CaptureFocus()
			end)
		end)
	end

	if props.focused ~= nil then
		effect(function()
			local value = read(props.focused)
			if textbox:IsFocused() == value then
				return
			end
			task.defer(function()
				if value then
					capture()
				else
					textbox:ReleaseFocus(false)
				end
			end)
		end)
	end

	return textbox
end
