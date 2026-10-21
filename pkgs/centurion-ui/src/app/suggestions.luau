local background = require("../components/background")
local button_name = require("../button")
local centurion = require("../../centurion")
local container = require("../components/container")
local corner = require("../components/corner")
local divider = require("../components/divider")
local fade = require("../fade")
local flex = require("../components/flex")
local padding = require("../components/padding")
local preferred_input = require("../input")
local px = require("../px")
local rich = require("../rich")
local state = require("../state")
local stroke = require("../components/stroke")
local text = require("../components/text")
local theme = require("../theme")
local types = require("../types")
local vide = require("../../vide")

local action = vide.action
local changed = vide.changed
local cleanup = vide.cleanup
local create = vide.create
local derive = vide.derive
local effect = vide.effect
local indexes = vide.indexes
local show = vide.show
local source = vide.source
local spring = vide.spring
local untrack = vide.untrack

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

-- small filled label, e.g. the type of an argument
local function pill(props: { text: () -> string, color: () -> Color3, order: number? })
	return background {
		auto = "XY",
		order = props.order,
		color = props.color,

		corner(px(4)),
		padding { x = px(4), y = px(2) },

		text {
			auto = "XY",
			text = props.text,
			text_size = px(state.subtext_size),
			text_style = "bg",
			weight = Enum.FontWeight.Bold,
		},
	}
end

local function suggestion_row(
	value: () -> types.AnalysisSuggestion,
	i: number,
	props: Suggestions,
	widths: vide.Source<{ [number]: number }>
)
	local function selected()
		return props.selected_suggestion() == i
	end
	local hovered = source(false)

	-- the width the row needs without being stretched, so the list can fit the widest
	local name_width = source(0)
	local description_width = source(0)

	effect(function()
		local width = name_width() + description_width() + px.convert(10)
		if untrack(widths)[i] ~= width then
			local current = table.clone(untrack(widths))
			current[i] = width
			widths(current)
		end
	end)
	cleanup(function()
		local current = table.clone(untrack(widths))
		current[i] = nil
		widths(current)
	end)

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
		padding { x = px(5), y = px(3) },
		flex():column():vertical("center"):between("horizontal"),

		container {
			auto = "XY",
			order = 1,

			flex():column():vertical("center"),
			changed("AbsoluteSize", function(size: Vector2)
				name_width(size.X)
			end),

			-- marks the suggestion Tab will complete
			text {
				size = px(UDim2.fromOffset(12, 0)),
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
			cleanup(function()
				description_width(0)
			end)

			return text {
				auto = "XY",
				order = 2,
				text = function()
					return value().description or ""
				end,
				text_size = px(state.subtext_size),
				text_style = "subtext",
				xalignment = Enum.TextXAlignment.Right,

				padding { left = px(28) },
				changed("AbsoluteSize", function(size: Vector2)
					description_width(size.X)
				end),
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

	-- set by the list, which is also at the bottom when it's too short to scroll
	local scrolled_to_bottom = source(true)

	return background {
		auto = "XY",
		order = props.order,
		color = function()
			return state.theme().background
		end,
		transparency = state.transparency,

		corner(px(6)),
		stroke {
			color = function()
				return theme.border(state.theme())
			end,
		},
		create "UISizeConstraint" {
			MinSize = function()
				return Vector2.new(px.convert(213), 0)
			end,
		},
		flex():row():fill("horizontal"),

		-- why the input can't be run as it is
		show(failed, function()
			return container {
				auto = "XY",
				order = 1,

				padding { x = px(8), y = px(5) },
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

				padding { x = px(8), y = px(5) },
				flex():row():gap(4),

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
			local content_height = source(0)
			local hovered = source(false)
			local widths = source({} :: { [number]: number })

			local canvas_y = source(0)

			-- rows are all the same height, so one is the average of them
			local function row_height()
				return content_height() / math.max(#props.analysis().suggestions, 1)
			end

			local function visible_height()
				return math.min(content_height(), row_height() * state.visible_suggestions())
			end

			effect(function()
				scrolled_to_bottom(canvas_y() >= content_height() - visible_height() - 1)
			end)

			-- only the rows in view decide the width, so a long one further down
			-- doesn't widen the list until it's scrolled to
			local target_width = derive(function()
				local height = row_height()
				if height == 0 then
					return 0
				end

				local current = widths()
				local first = math.floor(canvas_y() / height) + 1
				local last = math.ceil((canvas_y() + visible_height() - 0.5) / height)

				local widest = 0
				for i = first, last do
					widest = math.max(widest, current[i] or 0)
				end
				return math.ceil(widest)
			end)
			local sprung_width = spring(target_width, 0.1, 0.8)

			-- the list grows out from nothing when it first appears
			local opening = source(true)
			effect(function()
				if untrack(opening) and target_width() > 0 and sprung_width() >= target_width() - 0.5 then
					opening(false)
				end
			end)

			-- after opening, grows instantly so rows are never clipped, and only eases when shrinking
			local function content_width()
				if opening() then
					return sprung_width()
				end
				return math.max(target_width(), sprung_width())
			end

			return create "ScrollingFrame" {
				AutomaticCanvasSize = Enum.AutomaticSize.Y,
				BackgroundTransparency = 1,
				BorderSizePixel = 0,
				CanvasSize = UDim2.new(),
				ScrollingDirection = Enum.ScrollingDirection.Y,
				LayoutOrder = 4,
				Size = function()
					return UDim2.fromOffset(content_width() + px.convert(6), visible_height() + px.convert(6))
				end,

				-- the bar sits in the right padding rather than insetting the rows
				ScrollBarThickness = px(3),
				ScrollBarImageColor3 = function()
					return state.theme().subtext
				end,
				ScrollBarImageTransparency = fade.fade(spring(function()
					return if hovered() then 0 else 0.6
				end, 0.2)),
				VerticalScrollBarInset = Enum.ScrollBarInset.None,

				MouseEnter = function()
					hovered(true)
				end,
				MouseLeave = function()
					hovered(false)
				end,

				changed("CanvasPosition", function(position: Vector2)
					canvas_y(position.Y)
				end),

				padding(px(3)),

				create "UIListLayout" {
					HorizontalFlex = Enum.UIFlexAlignment.Fill,
					SortOrder = Enum.SortOrder.LayoutOrder,

					changed("AbsoluteContentSize", function(size: Vector2)
						content_height(size.Y)
					end),
				},

				-- keep the selected row in view when moving through the list
				action(function(instance: ScrollingFrame)
					effect(function()
						local height = row_height()
						if height == 0 then
							return
						end

						-- AbsoluteWindowSize lags behind and is 0 when the list first appears,
						-- which would scroll the first row out of view
						local top = (props.selected_suggestion() - 1) * height
						local window = visible_height()
						local y = instance.CanvasPosition.Y

						if top < y then
							y = top
						elseif top + height > y + window then
							y = top + height - window
						end

						instance.CanvasPosition = Vector2.new(0, y)
					end)
				end),

				indexes(function()
					return props.analysis().suggestions
				end, function(value: () -> types.AnalysisSuggestion, i)
					return suggestion_row(value, i, props, widths)
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

				padding { x = px(8), y = px(4) },
				flex():column():vertical("center"):between("horizontal"),

				text {
					auto = "XY",
					order = 1,
					text = function()
						local key = rich.color("%s", state.theme().text)
						if input() == Enum.PreferredInput.Touch then
							return `<b>{key:format("Tap")}</b> a suggestion to complete it`
						elseif input() == Enum.PreferredInput.Gamepad then
							return table.concat({
								`<b>{key:format(button_name(Enum.KeyCode.ButtonA))}</b> complete`,
								`<b>{key:format("D-pad")}</b> select`,
								`<b>{key:format(button_name(Enum.KeyCode.ButtonX))}</b> edit`,
								`<b>{key:format(button_name(Enum.KeyCode.ButtonY))}</b> run`,
								`<b>{key:format(button_name(Enum.KeyCode.ButtonB))}</b> close`,
							}, "    ")
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

				-- matches past the limit can't be scrolled to, so typing more is the only way to reach them.
				-- only shown at the end of the list, where they would have been
				show(function()
					return (props.analysis().hidden_suggestions or 0) > 0
				end, function()
					return text {
						auto = "XY",
						order = 2,
						text = function()
							return `+{props.analysis().hidden_suggestions} more`
						end,
						text_size = px(state.subtext_size),
						text_style = "subtext",
						xalignment = Enum.TextXAlignment.Right,
						-- faded rather than removed, so the footer doesn't change width while scrolling
						transparency = spring(function()
							return if scrolled_to_bottom() then 0 else 1
						end, 0.1),

						padding { left = px(16) },
					}
				end),
			}
		end),

		unpack(props),
	}
end

return suggestions
