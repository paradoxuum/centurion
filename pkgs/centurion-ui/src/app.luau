local UserInputService = game:GetService("UserInputService")

local analyse = require("./analyse")
local background = require("./components/background")
local centurion = require("../centurion")
local corner = require("./components/corner")
local create = require("./create")
local flex = require("./components/flex")
local padding = require("./components/padding")
local px = require("./px")
local state = require("./state")
local textbox = require("./components/textbox")
local types = require("./types")
local vide = require("../vide")

local action = vide.action
local cleanup = vide.cleanup
local derive = vide.derive
local effect = vide.effect
local source = vide.source
local show = vide.show
local indexes = vide.indexes

local function app()
	local raw_text = source("")
	local cursor_pos = source(0)
	local analysis = source({
		result = {
			success = true,
			value = nil,
		},
		suggestions = {},
	} :: types.AnalysisResult)

	local selected_suggestion = source(1)
	local next_cursor_pos = false

	local function autofill(text: string, span: vector, with: string)
		local before = string.sub(text, 1, span.x)
		local after = string.sub(text, span.y + 1, -1)

		task.defer(cursor_pos, span.x + #with + 2)
		print(span)
		return before .. with .. " " .. after
	end

	local disconnect_execute = centurion.command.on_execute(function(ctx)
		local new = table.clone(state.logs())
		table.insert(new, ctx.response)
		state.logs(new)
	end)

	local activation_keys = derive(function()
		local keys = {}
		for _, key in ipairs(state.options().activationKeys) do
			keys[key] = true
		end
		return keys
	end)

	local input_connection = UserInputService.InputBegan:Connect(function(input, processed)
		if processed then
			return
		end

		if input.UserInputState ~= Enum.UserInputState.Begin then
			return
		end

		local suggestions = analysis().suggestions
		if input.KeyCode == Enum.KeyCode.Up then
			selected_suggestion(math.min(selected_suggestion() + 1, #suggestions))
		elseif input.KeyCode == Enum.KeyCode.Down then
			selected_suggestion(math.max(selected_suggestion() - 1, 1))
		end

		if not activation_keys()[input.KeyCode] then
			return
		end

		state.opened(not state.opened())
	end)

	local analysing = false
	effect(function()
		raw_text()
		cursor_pos()

		if analysing then
			return
		end

		analysing = true
		task.defer(function()
			analysing = false

			local pos = cursor_pos()
			if pos == -1 then
				pos = #raw_text() + 1
			end
			analysis(analyse(raw_text(), pos))
		end)
	end)

	cleanup(function()
		disconnect_execute()
		input_connection:Disconnect()
	end)

	return create "Frame" {
		Size = px(UDim2.new(1, 0, 1, 0)),
		BackgroundTransparency = 1,

		corner(px(8)),
		padding(px(12)),

		create "UIListLayout" {
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = px(UDim.new(0, 8)),
		},

		create "Frame" {
			Size = px(UDim2.new(1, 0, 0, 64)),
			BackgroundTransparency = 1,

			flex():fill("horizontal"):vertical "bottom",

			background {
				auto = "Y",
				color = state.theme.surface,

				corner(px(4)),
				padding(px(8)),

				textbox {
					placeholder = "Enter command",
					xalignment = Enum.TextXAlignment.Left,
					text_size = px(24),
					text_color = function()
						local analysis_result = analysis()
						if analysis_result.result.success then
							return state.theme.text()
						end

						return analysis_result.result.success and state.theme.text() or state.theme.error()
					end,

					text = raw_text,
					update_text = function(text)
						local pos = next_cursor_pos or cursor_pos()
						local last_char = string.sub(text, pos - 1, pos - 1)

						local suggestions = analysis().suggestions
						if last_char == "\t" and suggestions[1] then
							local selected = suggestions[selected_suggestion()]
							text = autofill(raw_text(), selected.token, selected.replace)
						end

						raw_text(text)
					end,

					action(function(instance: TextBox)
						local function update(pos: number)
							if next_cursor_pos then
								next_cursor_pos = pos
								return
							end

							next_cursor_pos = pos
							task.defer(function()
								cursor_pos(next_cursor_pos)
								next_cursor_pos = false
							end)
						end

						local connection = instance:GetPropertyChangedSignal("CursorPosition"):Connect(function()
							update(instance.CursorPosition)
						end)

						cleanup(function()
							return connection:Disconnect()
						end)

						update(instance.CursorPosition)
					end),
				},

				flex():fill():vertical("center"):horizontal "left",
			},
		},

		create "Frame" {
			AutomaticSize = "XY",
			Visible = function()
				return analysis() and not analysis().result.success
			end,
			BackgroundColor3 = state.theme.surface(),

			corner(px(4)),
			padding(px(8)),

			create "TextLabel" {
				AutomaticSize = "XY",
				BackgroundTransparency = 1,

				Text = function()
					return analysis().result.error or ""
				end,
				TextSize = px(18),
				TextColor3 = state.theme.error(),
				TextXAlignment = Enum.TextXAlignment.Left,
			},
		},

		create "Frame" {
			AutomaticSize = "XY",
			BackgroundTransparency = 1,

			corner(px(4)),

			flex():fill("horizontal"):vertical("top"):gap(8),

			show(function()
				return analysis().argument ~= nil
			end, function()
				return create "Frame" {
					AutomaticSize = "XY",
					BackgroundColor3 = state.theme.surface(),

					corner(px(4)),
					padding(px(8)),

					flex():row():vertical("center"):gap(4),

					create "TextLabel" {
						AutomaticSize = "XY",
						BackgroundTransparency = 1,
						Text = function()
							return analysis().argument and analysis().argument.name or ""
						end,
						TextColor3 = state.theme.text(),
						TextSize = px(24),
						TextXAlignment = Enum.TextXAlignment.Left,
					},

					create "Frame" {
						AutomaticSize = "XY",
						BackgroundColor3 = state.theme.highlight(),

						corner(px(4)),
						padding(px(4)),

						create "TextLabel" {
							AutomaticSize = "XY",
							BackgroundTransparency = 1,
							Text = function()
								return analysis().argument and analysis().argument.type or ""
							end,
							TextColor3 = state.theme.background(),
							TextSize = px(16),
							TextXAlignment = Enum.TextXAlignment.Left,
						},
					},

					create "TextLabel" {
						AutomaticSize = "XY",
						BackgroundTransparency = 1,
						Text = function()
							return analysis().argument and analysis().argument.description or ""
						end,
						TextColor3 = state.theme.subtext(),
						TextSize = px(16),
						TextXAlignment = Enum.TextXAlignment.Left,
						Visible = function()
							return analysis().argument and analysis().argument.description ~= nil
						end,
					},
				}
			end),

			indexes(function()
				local suggestions = analysis().suggestions

				local limited = {}

				-- todo: create constant or option for max suggestions
				for i = 1, math.min(5, #suggestions) do
					limited[i] = suggestions[i]
				end
				return limited
			end, function(value: () -> types.AnalysisSuggestion, i)
				return create "Frame" {
					AutomaticSize = "XY",
					BackgroundColor3 = function()
						return selected_suggestion() == i and state.theme.surface() or state.theme.background()
					end,
					LayoutOrder = i,

					corner(px(4)),
					padding(px(8)),

					flex():row():vertical("center"):gap(4),

					create "TextLabel" {
						AutomaticSize = "XY",
						BackgroundTransparency = 1,
						Text = function()
							return value().name
						end,
						TextColor3 = state.theme.text(),
						TextSize = px(24),
						TextXAlignment = Enum.TextXAlignment.Left,
						LayoutOrder = i,
					},

					create "TextLabel" {
						AutomaticSize = "XY",
						BackgroundTransparency = 1,
						Text = function()
							return value().description or ""
						end,
						TextColor3 = state.theme.subtext(),
						TextSize = px(14),
						TextXAlignment = Enum.TextXAlignment.Left,
						LayoutOrder = i,
						Visible = function()
							return value().description ~= nil
						end,
					},
				}
			end),
		},
	}
end

return app
