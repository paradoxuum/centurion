local background = require("../components/background")
local centurion = require("../../centurion")
local container = require("../components/container")
local corner = require("../components/corner")
local flex = require("../components/flex")
local padding = require("../components/padding")
local px = require("../px")
local state = require("../state")
local text = require("../components/text")
local types = require("../types")
local vide = require("../../vide")

local create = vide.create
local derive = vide.derive
local indexes = vide.indexes
local show = vide.show

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

		local cmd = centurion.command.commands[props.analysis().command]
		if cmd == nil or cmd.arguments == nil then
			return nil
		end

		local args = { cmd.arguments() }
		return args[props.analysis().argument]
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

				flex():row():vertical("center"):gap(4),

				text {
					auto = "XY",
					text = function()
						return arg().name
					end,
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
							return arg().type
						end,
						text_size = px(state.subtext_size),
						text_style = "bg",
						xalignment = Enum.TextXAlignment.Left,
					},
				},

				show(function()
					return arg().description ~= nil
				end, function()
					return text {
						auto = "XY",
						text = function()
							return arg().description
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
			return create "TextButton" {
				AutomaticSize = "XY",
				BackgroundColor3 = function()
					return props.selected_suggestion() == i and state.theme().surface or state.theme().background
				end,
				BackgroundTransparency = state.transparency,
				LayoutOrder = i,
				Text = "",

				Activated = function()
					props.on_select(value())
				end,

				flex():row():vertical("center"):gap(4),
				corner(px(4)),
				padding(px(8)),

				text {
					auto = "XY",
					text = function()
						return value().name
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
