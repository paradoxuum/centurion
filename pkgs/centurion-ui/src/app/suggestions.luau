local UserInputService = game:GetService("UserInputService")

local background = require("../components/background")
local centurion = require("../../centurion")
local container = require("../components/container")
local corner = require("../components/corner")
local divider = require("../components/divider")
local fade = require("../fade")
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

local cleanup = vide.cleanup
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
	read order: number?,

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

local function preferred_input(): () -> Enum.PreferredInput
	local preferred = source(UserInputService.PreferredInput)
	cleanup(UserInputService:GetPropertyChangedSignal("PreferredInput"):Connect(function()
		preferred(UserInputService.PreferredInput)
	end))
	return preferred
end

-- small filled label, e.g. the type of an argument
local function pill(props: { text: () -> string, color: () -> Color3, order: number? })
	return background {
		auto = "XY",
		order = props.order,
		color = props.color,

		corner(px(4)),
		padding { x = px(6), y = px(2) },

		text {
			auto = "XY",
			text = props.text,
			text_size = px(state.subtext_size),
			text_style = "bg",
			weight = Enum.FontWeight.Bold,
		},
	}
end

local function suggestion_row(value: () -> types.AnalysisSuggestion, i: number, props: Suggestions)
	local function selected()
		return props.selected_suggestion() == i
	end
	local hovered = source(false)

	return create "TextButton" {
		AutomaticSize = Enum.AutomaticSize.XY,
		AutoButtonColor = false,
		BackgroundColor3 = function()
			return state.theme().surface
		end,
		BackgroundTransparency = fade.fade(spring(function()
			if selected() then
				return state.transparency()
			elseif hovered() then
				return 1 - (1 - state.transparency()) * 0.5
			end
			return 1
		end, 0.1)),
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

		corner(px(4)),
		padding { x = px(8), y = px(5) },
		flex():column():vertical("center"):between("horizontal"),

		container {
			auto = "XY",
			order = 1,

			flex():column():vertical("center"),

			-- marks the suggestion Tab will complete
			text {
				size = px(UDim2.fromOffset(18, 0)),
				auto = "Y",
				order = 1,
				text = ">",
				text_style = "highlight",
				weight = Enum.FontWeight.Bold,
				xalignment = Enum.TextXAlignment.Left,
				transparency = spring(function()
					return if selected() then 0 else 1
				end, 0.1),
			},

			text {
				auto = "XY",
				order = 2,
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
					return if selected() then "normal" else "subtext"
				end,
				xalignment = Enum.TextXAlignment.Left,
			},
		},

		show(function()
			return value().description ~= nil
		end, function()
			return text {
				auto = "XY",
				order = 2,
				text = function()
					return value().description or ""
				end,
				text_size = px(state.subtext_size),
				text_style = "subtext",
				xalignment = Enum.TextXAlignment.Right,

				-- keeps the description away from the name
				padding { left = px(32) },
			}
		end),
	}
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

	local failed = derive(function()
		return not props.analysis().result.success
	end)

	local has_suggestions = derive(function()
		return #props.analysis().suggestions > 0
	end)

	local input = preferred_input()

	-- the sections above the list, which are divided from it when both are shown
	local has_details = derive(function()
		return failed() or arg() ~= nil
	end)

	return background {
		auto = "XY",
		order = props.order,
		color = function()
			return state.theme().background
		end,
		transparency = state.transparency,

		corner(px(8)),
		stroke {
			color = function()
				return theme.border(state.theme())
			end,
		},
		create "UISizeConstraint" {
			MinSize = function()
				return Vector2.new(px.convert(320), 0)
			end,
		},
		flex():row():fill("horizontal"),

		-- why the input can't be run as it is
		show(failed, function()
			return container {
				auto = "XY",
				order = 1,

				padding { x = px(12), y = px(8) },
				flex():column():vertical("center"):gap(8),

				pill {
					order = 1,
					text = function()
						return "error"
					end,
					color = function()
						return state.theme().error
					end,
				},

				text {
					auto = "XY",
					order = 2,
					text = function()
						return props.analysis().result.error or ""
					end,
					text_size = px(state.subtext_size),
					text_style = "error",
					xalignment = Enum.TextXAlignment.Left,
				},
			}
		end),

		-- the full signature, and details of the argument being typed
		show(arg, function()
			return container {
				auto = "XY",
				order = 2,

				padding { x = px(12), y = px(8) },
				flex():row():gap(6),

				text {
					auto = "XY",
					order = 1,
					text = function()
						local current = usage()
						if not current then
							return ""
						end

						local colors = state.theme()
						local parts = { `<b>{rich.escape(current.command)}</b>` }
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

				container {
					auto = "XY",
					order = 2,

					flex():column():vertical("center"):gap(8),

					pill {
						order = 1,
						text = function()
							return arg() and arg().type or ""
						end,
						color = function()
							return state.theme().highlight
						end,
					},

					text {
						auto = "XY",
						order = 2,
						text = function()
							return arg() and arg().name or ""
						end,
						weight = Enum.FontWeight.Bold,
						xalignment = Enum.TextXAlignment.Left,
					},

					show(function()
						return arg() and arg().description ~= nil
					end, function()
						return text {
							auto = "XY",
							order = 3,
							text = function()
								return arg() and arg().description or ""
							end,
							text_size = px(state.subtext_size),
							text_style = "subtext",
							xalignment = Enum.TextXAlignment.Left,
						}
					end),
				},
			}
		end),

		divider {
			order = 3,
			visible = function()
				return has_details() and has_suggestions()
			end,
		},

		show(has_suggestions, function()
			return container {
				auto = "XY",
				order = 4,

				padding(px(4)),
				flex():row():fill("horizontal"),

				indexes(function()
					return props.analysis().suggestions
				end, function(value: () -> types.AnalysisSuggestion, i)
					return suggestion_row(value, i, props)
				end),
			}
		end),

		divider {
			order = 5,
			visible = has_suggestions,
		},

		show(has_suggestions, function()
			return container {
				auto = "XY",
				order = 6,

				padding { x = px(12), y = px(6) },

				text {
					auto = "XY",
					text = function()
						local key = rich.color("%s", state.theme().text)
						if input() == Enum.PreferredInput.Touch then
							return `<b>{key:format("Tap")}</b> a suggestion to complete it`
						elseif input() == Enum.PreferredInput.Gamepad then
							return `<b>{key:format("Select")}</b> a suggestion to complete it`
						end

						local hints = {
							`<b>{key:format("Tab")}</b> complete`,
							`<b>{key:format("↑↓")}</b> select`,
							`<b>{key:format("Enter")}</b> run`,
						}
						return table.concat(hints, "    ")
					end,
					rich_text = true,
					text_size = px(state.subtext_size),
					text_style = "subtext",
					xalignment = Enum.TextXAlignment.Left,
				},
			}
		end),

		unpack(props),
	}
end

return suggestions
