local background = require("../components/background")
local container = require("../components/container")
local corner = require("../components/corner")
local flex = require("../components/flex")
local image = require("../components/image")
local padding = require("../components/padding")
local preferred_input = require("../input")
local px = require("../px")
local state = require("../state")
local text = require("../components/text")
local vide = require("../../vide")

local show = vide.show

type Header = {
	read order: number?,
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

local function header(props: Header)
	local input = preferred_input()

	return container {
		size = px(UDim2.new(1, 0, 0, 34)),
		order = props.order,

		padding { x = px(12) },
		flex():column():vertical("center"):between("horizontal"),

		container {
			auto = "XY",
			order = 1,

			flex():column():vertical("center"):gap(8),

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

		show(function()
			return input() == Enum.PreferredInput.KeyboardAndMouse and #state.activation_keys() > 0
		end, function()
			return container {
				auto = "XY",
				order = 2,

				flex():column():vertical("center"):gap(6),

				background {
					auto = "XY",
					order = 1,
					color = function()
						return state.theme().surface
					end,

					corner(px(4)),
					padding { x = px(6), y = px(2) },

					text {
						auto = "XY",
						text = function()
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
	}
end

return header
