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
local source = vide.source
local spring = vide.spring

export type Suggestions = {
	read analysis: () -> types.AnalysisResult,
	read selected_suggestion: () -> number,
	read on_select: (suggestion: types.AnalysisSuggestion) -> (),
	read position: () -> UDim2,

	[number]: unknown,
}

-- e.g. <name: type>, [name: type] if optional, <name: type...> if it takes the rest of the input
local function format_argument(arg: centurion.Argument): string
	local label = `{arg.name}: {arg.type}`

	local num_args = arg.num_args
	if num_args == "rest" then
		label ..= "..."
	elseif typeof(num_args) == "number" and num_args > 1 then
		label ..= ` x{num_args}`
	end

	return if arg.optional then `[{label}]` else `<{label}>`
end

local function suggestions(props: Suggestions)
	local usage = derive(function()
		local analysis = props.analysis()
		if analysis.argument == nil or analysis.command == nil then
			return nil
		end

		local cmd = centurion.registry.commands[analysis.command]
		if cmd == nil or cmd.arguments == nil then
			return nil
		end

		local args: { centurion.Argument } = { cmd.arguments() }
		return {
			command = analysis.command,
			args = args,
			index = analysis.argument.index,
		}
	end)

	local arg = derive(function()
		local current = usage()
		return current and current.args[current.index]
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

				-- full usage of the command, with the argument being typed emphasised
				text {
					auto = "XY",
					text = function()
						local current = usage()
						if not current then
							return ""
						end

						local colors = state.theme()
						local parts = { rich.escape(current.command) }
						for i, value in current.args do
							local label = rich.escape(format_argument(value))
							table.insert(
								parts,
								if i == current.index
									then `<b>{rich.color(label, colors.highlight)}</b>`
									else rich.color(label, colors.subtext)
							)
						end

						return table.concat(parts, " ")
					end,
					rich_text = true,
					text_size = px(state.subtext_size),
					xalignment = Enum.TextXAlignment.Left,
				},

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
			local hovered = source(false)

			return create "TextButton" {
				AutomaticSize = "XY",
				AutoButtonColor = false,
				BackgroundColor3 = spring(function()
					local current = state.theme()
					if selected() then
						return current.surface
					elseif hovered() then
						return current.background:Lerp(current.surface, 0.5)
					end
					return current.background
				end, 0.1),
				BackgroundTransparency = state.transparency,
				LayoutOrder = i,
				Text = "",

				MouseEnter = function()
					hovered(true)
				end,
				MouseLeave = function()
					hovered(false)
				end,

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
