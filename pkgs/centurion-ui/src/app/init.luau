local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local analyse = require("./analyse")
local centurion = require("../centurion")
local corner = require("./components/corner")
local create = require("./create")
local flex = require("./components/flex")
local history = require("@self/history")
local padding = require("./components/padding")
local px = require("./px")
local state = require("./state")
local suggestions = require("@self/suggestions")
local text = require("./components/text")
local textbox = require("./components/textbox")
local types = require("./types")
local vide = require("../vide")

local action = vide.action
local cleanup = vide.cleanup
local changed = vide.changed
local derive = vide.derive
local effect = vide.effect
local source = vide.source

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

	local executing = source(false)
	local selected_suggestion = source(1)
	local over_interface = source(false)

	local next_cursor_pos = false
	local cmd_history = {}
	local cmd_history_index = 0

	local function catch_hover()
		return action(function(instance: Frame)
			cleanup(instance.MouseEnter:Connect(function()
				over_interface(true)
			end))
			cleanup(instance.MouseLeave:Connect(function()
				over_interface(false)
			end))
		end)
	end

	local function log(command: string, response: centurion.Response)
		local logs = state.logs()
		table.insert(logs, 1, {
			command = command,
			response = response,
		})
		table.remove(logs, 100)
		state.logs(logs)
	end

	local function autofill(value: string, token: vector, with: string)
		local span_start = token.x - 1
		local before = string.sub(value, 1, span_start)
		local after = string.sub(value, token.y + 1, -1)

		task.defer(cursor_pos, span_start + #with + 2)
		return before .. with .. " " .. after
	end

	local activation_keys = derive(function()
		local keys = {}
		for _, key in ipairs(state.activation_keys()) do
			keys[key] = true
		end
		return keys
	end)

	local function handle_navigation(up: boolean)
		local suggested = analysis().suggestions
		if #suggested == 0 then
			cmd_history_index = math.clamp(cmd_history_index + (up and 1 or -1), 0, #cmd_history)
			raw_text(cmd_history[cmd_history_index] or "")
			cursor_pos(#raw_text() + 1)

			return
		end

		selected_suggestion(math.clamp(selected_suggestion() + (up and -1 or 1), 1, #suggested))
	end

	cleanup(UserInputService.InputBegan:Connect(function(input)
		if input.UserInputState ~= Enum.UserInputState.Begin then
			return
		end

		if
			state.hide_on_lost_focus()
			and not over_interface()
			and (
				input.UserInputType == Enum.UserInputType.MouseButton1
				or input.UserInputType == Enum.UserInputType.Touch
			)
		then
			state.opened(false)
			return
		end

		if input.KeyCode == Enum.KeyCode.Up then
			handle_navigation(true)
		elseif input.KeyCode == Enum.KeyCode.Down then
			handle_navigation(false)
		end

		if not activation_keys()[input.KeyCode] then
			return
		end

		state.opened(not state.opened())
	end))

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

	return create "Frame" {
		Size = px(UDim2.new(1, 0, 0, 0)),
		BackgroundTransparency = 1,

		corner(px(8)),
		padding(px(12)),

		create "UIListLayout" {
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = px(UDim.new(0, 8)),
		},

		create "Frame" {
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundColor3 = function()
				return state.theme().background
			end,
			Size = UDim2.new(1, 0, 0, 0),

			flex():fill("horizontal"):vertical("bottom"),
			corner(px(4)),
			catch_hover(),

			history(),

			textbox {
				corner(px(4)),
				padding(px(8)),

				background_color = function()
					return state.theme().surface
				end,
				background_transparency = 0,

				placeholder = "Enter command",
				xalignment = Enum.TextXAlignment.Left,
				text_size = px(24),
				text_style = function()
					local analysis_result = analysis()
					return analysis_result.result.success and "normal" or "error"
				end,

				text = raw_text,
				update_text = function(value)
					local pos = next_cursor_pos or cursor_pos()
					local last_char = string.sub(value, pos - 1, pos - 1)

					local suggested = analysis().suggestions
					if last_char == "\t" and suggested[1] then
						local selected = suggested[selected_suggestion()]
						value = autofill(raw_text(), selected.span, selected.replace)
					end
					raw_text(value)
				end,

				focused = state.focused,
				update_focused = state.focused,

				enter = function(value)
					raw_text("")
					task.delay(0.1, function()
						state.focused(true)
					end)

					if #value:gsub("%s", "") == 0 then
						return
					end

					cmd_history_index = 0
					table.insert(cmd_history, 1, value)

					local cmd = analysis().command
					if not cmd then
						log(value, {
							success = false,
							message = "Unknown command",
							timestamp = os.time(),
						})
						return
					end

					executing(true)

					local result = centurion.command.execute(Players.LocalPlayer, cmd, analysis().arguments or {})
					if result.response then
						if result.response.message ~= "" then
							log(value, result.response)
						end
					else
						log(value, {
							success = true,
							message = "Command executed",
							timestamp = os.time(),
						})
					end

					executing(false)
				end,

				{
					CursorPosition = cursor_pos,

					changed("CursorPosition", function(new)
						if next_cursor_pos then
							next_cursor_pos = new
							return
						end

						next_cursor_pos = new
						task.defer(function()
							cursor_pos(next_cursor_pos)
							next_cursor_pos = false
						end)
					end),
				},
			},
		},

		create "Frame" {
			AutomaticSize = "XY",
			Visible = function()
				return analysis() and not analysis().result.success
			end,
			BackgroundColor3 = function()
				return state.theme().surface
			end,

			corner(px(4)),
			padding(px(8)),
			catch_hover(),

			text {
				auto = "XY",
				text = function()
					return analysis().result.error or ""
				end,
				text_size = px(18),
				text_style = "error",
				xalignment = Enum.TextXAlignment.Left,
			},
		},

		suggestions {
			analysis = analysis,
			selected_suggestion = selected_suggestion,
			on_select = function(suggestion: types.AnalysisSuggestion)
				raw_text(autofill(raw_text(), suggestion.span, suggestion.replace))
			end,

			catch_hover(),
		},
	}
end

return app
