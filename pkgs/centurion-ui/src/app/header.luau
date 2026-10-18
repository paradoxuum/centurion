local background = require("../components/background")
local button_name = require("../button")
local container = require("../components/container")
local corner = require("../components/corner")
local flex = require("../components/flex")
local image = require("../components/image")
local padding = require("../components/padding")
local preferred_input = require("../input")
local px = require("../px")
local state = require("../state")
local text = require("../components/text")
local theme = require("../theme")
local vide = require("../../vide")

local create = vide.create
local show = vide.show
local source = vide.source

type Header = {
	read order: number?,
	read on_clear: () -> (),
}

-- KeyCode names that aren't what's printed on the key
local key_labels: { [string]: string } = {
	Backquote = "`",
	Tilde = "~",
	Semicolon = ";",
	Quote = "'",
	Slash = "/",
	BackSlash = "\\",
	Comma = ",",
	Period = ".",
	Minus = "-",
	Equals = "=",
	LeftBracket = "[",
	RightBracket = "]",
}

local function key_label(key: Enum.KeyCode): string
	return key_labels[key.Name] or key.Name
end

local function clear_button(props: { order: number, on_clear: () -> () })
	local hovered = source(false)

	return create "TextButton" {
		AutomaticSize = Enum.AutomaticSize.XY,
		AutoButtonColor = false,
		BackgroundTransparency = 1,
		LayoutOrder = props.order,
		Text = "",

		Activated = props.on_clear,
		MouseEnter = function()
			hovered(true)
		end,
		MouseLeave = function()
			hovered(false)
		end,

		text {
			auto = "XY",
			text = "Clear",
			text_size = px(state.subtext_size),
			text_style = function()
				return if hovered() then "highlight" else "subtext"
			end,
			weight = Enum.FontWeight.Bold,
		},
	}
end

local function header(props: Header)
	local input = preferred_input()

	local function show_clear()
		return state.clear_button() and #state.logs() > 0
	end

	local function show_hint()
		if input() == Enum.PreferredInput.Gamepad then
			return true
		end
		return input() == Enum.PreferredInput.KeyboardAndMouse and #state.activation_keys() > 0
	end

	return container {
		size = px(UDim2.new(1, 0, 0, 23)),
		order = props.order,

		padding { x = px(8) },
		flex():column():vertical("center"):between("horizontal"),

		container {
			auto = "XY",
			order = 1,

			flex():column():vertical("center"):gap(5),

			image {
				image = state.icon,
				size = px(function()
					return UDim2.fromOffset(state.subtext_size(), state.subtext_size())
				end),
				color = function()
					return state.theme().highlight
				end,
				visible = function()
					return state.icon() ~= ""
				end,
				order = 1,
			},

			text {
				auto = "XY",
				order = 2,
				text = state.title,
				text_size = px(state.subtext_size),
				text_style = "subtext",
				weight = Enum.FontWeight.Bold,
			},
		},

		container {
			auto = "XY",
			order = 2,

			flex():column():vertical("center"):gap(8),

			-- only shown while there's something to clear
			show(show_clear, function()
				return clear_button { order = 1, on_clear = props.on_clear }
			end),

			-- vertical rule between the clear button and the close hint
			show(function()
				return show_clear() and show_hint()
			end, function()
				return background {
					order = 2,
					size = px(function()
						return UDim2.fromOffset(1, state.subtext_size())
					end),
					color = function()
						return theme.border(state.theme())
					end,
				}
			end),

			show(show_hint, function()
				return container {
					auto = "XY",
					order = 3,

					flex():column():vertical("center"):gap(4),

					background {
						auto = "XY",
						order = 1,
						color = function()
							return state.theme().surface
						end,

						corner(px(4)),
						padding { x = px(4), y = px(1) },

						text {
							auto = "XY",
							text = function()
								-- gamepads close with B rather than an activation key
								if input() == Enum.PreferredInput.Gamepad then
									return button_name(Enum.KeyCode.ButtonB)
								end
								return key_label(state.activation_keys()[1])
							end,
							text_size = px(state.subtext_size),
							weight = Enum.FontWeight.Bold,
						},
					},

					text {
						auto = "XY",
						order = 2,
						text = "to close",
						text_size = px(state.subtext_size),
						text_style = "subtext",
					},
				}
			end),
		},
	}
end

return header
