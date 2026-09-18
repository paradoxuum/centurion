local background = require("../components/background")
local centurion = require("../../centurion")
local container = require("../components/container")
local corner = require("../components/corner")
local flex = require("../components/flex")
local padding = require("../components/padding")
local px = require("../px")
local rich = require("../rich")
local state = require("../state")
local stroke = require("../components/stroke")
local text = require("../components/text")
local theme = require("../theme")
local types = require("../types")
local vide = require("../../vide")

local create = vide.create
local derive = vide.derive
local indexes = vide.indexes
local show = vide.show
local spring = vide.spring

export type Suggestions = {
	read analysis: () -> types.AnalysisResult,
	read selected_suggestion: () -> number,
	read on_select: (suggestion: types.AnalysisSuggestion) -> (),
	read position: () -> UDim2,

	[number]: unknown,
}

local function suggestions(props: Suggestions)
	local arg = derive(function()
		if props.analysis().argument == nil or props.analysis().command == nil then
			return nil
		end

		local cmd = centurion.registry.commands[props.analysis().command]
		if cmd == nil or cmd.arguments == nil then
			return nil
		end

		local args = { cmd.arguments() }
		return args[props.analysis().argument.index]
	end)

	return container {
		auto = "XY",
		size = UDim2.fromScale(0, 0),

		corner(px(4)),
		flex():fill("horizontal"):vertical("top"):gap(8),

		show(function()
			return arg() ~= nil
		end, function()
			return background {
				auto = "XY",
				color = function()
					return state.theme().surface
				end,
				transparency = state.transparency,

				corner(px(4)),
				padding(px(8)),
				stroke {
					color = function()
						return theme.border(state.theme())
					end,
				},

				flex():row():vertical("center"):gap(4),

				text {
					auto = "XY",
					text = function()
						return arg() and arg().name or ""
					end,
					weight = Enum.FontWeight.Bold,
					xalignment = Enum.TextXAlignment.Left,
				},

				background {
					auto = "XY",
					color = function()
						return state.theme().highlight
					end,
					transparency = state.transparency,

					corner(px(4)),
					padding(px(4)),

					text {
						auto = "XY",
						text = function()
							return arg() and arg().type or ""
						end,
						text_size = px(state.subtext_size),
						text_style = "bg",
						xalignment = Enum.TextXAlignment.Left,
					},
				},

				show(function()
					return arg() and arg().description ~= nil
				end, function()
					return text {
						auto = "XY",
						text = function()
							return arg() and arg().description or ""
						end,
						text_size = px(state.subtext_size),
						text_style = "subtext",
						xalignment = Enum.TextXAlignment.Left,
					}
				end),
			}
		end),

		indexes(function()
			return props.analysis().suggestions
		end, function(value: () -> types.AnalysisSuggestion, i)
			local function selected()
				return props.selected_suggestion() == i
			end

			return create "TextButton" {
				AutomaticSize = "XY",
				AutoButtonColor = false,
				BackgroundColor3 = spring(function()
					return selected() and state.theme().surface or state.theme().background
				end, 0.1),
				BackgroundTransparency = state.transparency,
				LayoutOrder = i,
				Text = "",

				Activated = function()
					props.on_select(value())
				end,

				flex():row():vertical("center"):gap(4),
				corner(px(4)),
				padding(px(8)),
				stroke {
					color = function()
						return state.theme().highlight
					end,
					transparency = spring(function()
						return selected() and 0 or 1
					end, 0.1),
				},

				text {
					auto = "XY",
					-- characters matching the input are emphasised
					text = function()
						local suggestion = value()
						local name = suggestion.name
						local highlight = state.theme().highlight

						local out = {}
						local pos = 1
						for _, range in suggestion.matches do
							table.insert(out, rich.escape(name:sub(pos, range.x - 1)))
							table.insert(out, `<b>{rich.color(rich.escape(name:sub(range.x, range.y)), highlight)}</b>`)
							pos = range.y + 1
						end
						table.insert(out, rich.escape(name:sub(pos)))

						return table.concat(out)
					end,
					rich_text = true,
					text_style = function()
						return selected() and "highlight" or "normal"
					end,
					xalignment = Enum.TextXAlignment.Left,
					order = i,
				},

				show(function()
					return value().description ~= nil
				end, function()
					return text {
						auto = "XY",
						text = function()
							return value().description or ""
						end,
						text_size = px(state.subtext_size),
						text_style = "subtext",
						xalignment = Enum.TextXAlignment.Left,
						order = i,
					}
				end),
			}
		end),

		unpack(props),
	}
end

return suggestions
