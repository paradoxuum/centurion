local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local analyse = require("./analyse")
local background = require("./components/background")
local centurion = require("../centurion")
local container = require("./components/container")
local corner = require("./components/corner")
local flex = require("./components/flex")
local highlight = require("./analyse/highlight")
local history = require("@self/history")
local padding = require("./components/padding")
local px = require("./px")
local state = require("./state")
local stroke = require("./components/stroke")
local suggestions = require("@self/suggestions")
local text = require("./components/text")
local textbox = require("./components/textbox")
local theme = require("./theme")
local types = require("./types")
local vide = require("../vide")

local action = vide.action
local create = vide.create
local cleanup = vide.cleanup
local changed = vide.changed
local derive = vide.derive
local effect = vide.effect
local source = vide.source
local spring = vide.spring

local default_analysis = {
	result = {
		success = true,
		value = nil,
	},
	suggestions = {},
} :: types.AnalysisResult
local max_history_lines = 8
local spinner_frames = { "|", "/", "-", "\\" }

local function app()
	local raw_text = source("")
	local cursor_pos = source(0)
	local analysis = source(default_analysis)

	-- same as analysis, but isn't reset when submitting (used for animations)
	local display_analysis = source(default_analysis)

	-- commands waiting on a response
	local executing = source(0)
	local executing_command = source("")
	local busy = source(false)
	local spinner_frame = source(1)

	local selected_suggestion = source(1)
	local over_interface = source(false)

	local next_cursor_pos = false
	local cmd_history = {}
	local cmd_history_index = 0

	-- shakes the input and flashes its outline when a command fails
	local shake, shake_settings = spring(function()
		return 0
	end, 0.12, 0.25)
	local failed = source(false)
	local failures = 0

	local function signal_failure()
		failures += 1
		local id = failures

		shake_settings({ impulse = 300 })
		failed(true)
		task.delay(0.4, function()
			if failures == id then
				failed(false)
			end
		end)
	end

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

		if not response.success then
			signal_failure()
		end
	end

	local function autofill(value: string, token: vector, with: string, update_cursor_pos: boolean)
		local span_start = token.x - 1
		local before = string.sub(value, 1, span_start)
		local after = string.sub(value, token.y + 1, -1)

		if update_cursor_pos then
			task.defer(cursor_pos, span_start + #with + 2)
			selected_suggestion(1)
		end

		local arg = analysis().argument

		local add_space = true
		if arg ~= nil then
			local cmd = centurion.registry.commands[analysis().command]
			local args = { cmd.arguments() }
			if arg.index == #args or arg.kind == "list" then
				add_space = false
			end
		end

		return before .. with .. (add_space and " " or "") .. after
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

		if
			#suggested == 0
			or UserInputService:IsKeyDown(Enum.KeyCode.LeftShift)
			or (selected_suggestion() == 1 and up and #cmd_history > 0)
		then
			cmd_history_index = math.clamp(cmd_history_index + (up and 1 or -1), 0, #cmd_history)
			raw_text(cmd_history[cmd_history_index] or "")
			cursor_pos(#raw_text() + 1)

			return
		end

		selected_suggestion(math.clamp(selected_suggestion() + (up and -1 or 1), 1, #suggested))
	end

	effect(function()
		if raw_text() == "" then
			return
		end
		display_analysis(analysis())
	end)

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

		local opened = not state.opened()
		state.opened(opened)
		state.focused(opened)

		local input_text = raw_text()
		if opened and #input_text > 0 then
			analysis(analyse(input_text, #input_text + 1, state.max_suggestions))
		end
	end))

	effect(function()
		if executing() == 0 then
			busy(false)
			return
		end

		local thread = task.delay(0.1, busy, true)
		cleanup(function()
			task.cancel(thread)
		end)
	end)

	effect(function()
		if not busy() then
			return
		end

		cleanup(RunService.Heartbeat:Connect(function()
			spinner_frame(math.floor(os.clock() * 10) % #spinner_frames + 1)
		end))
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
				return
			end

			analysis(analyse(raw_text(), pos, state.max_suggestions))
		end)
	end)

	return container {
		auto = "Y",
		anchor = state.anchor,
		position = spring(function()
			return px.get(state.position() + UDim2.fromOffset(0, px.convert(state.opened() and 0 or 16)))
		end, 0.3),
		size = px(function()
			local w = state.width()
			return UDim2.new(w.Scale, w.Offset, 0, 0)
		end),

		corner(px(8)),
		padding(px(12)),

		create "UIListLayout" {
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = px(UDim.new(0, 8)),
		},

		background {
			auto = "Y",
			size = UDim2.new(1, 0, 0, 0),
			color = function()
				return state.theme().background
			end,
			transparency = state.transparency,

			flex():fill("horizontal"):vertical("bottom"),
			corner(px(8)),
			padding(px(4)),
			stroke {
				color = function()
					return theme.border(state.theme())
				end,
			},
			catch_hover(),

			history {
				max_lines = max_history_lines,
			},

			background {
				auto = "XY",
				color = function()
					return state.theme().surface
				end,
				transparency = state.transparency,

				corner(px(4)),
				padding {
					padding = px(8),
					left = px(function()
						return 32 + shake()
					end),
					right = px(function()
						return 8 - shake()
					end),
				},
				stroke {
					color = spring(function()
						local current = state.theme()
						if failed() or not analysis().result.success then
							return current.error
						elseif busy() or state.focused() then
							return current.highlight
						end
						return theme.border(current)
					end, 0.15),
				},

				text {
					text = function()
						return if busy() then spinner_frames[spinner_frame()] else ">"
					end,
					text_style = function()
						return (busy() or analysis().result.success) and "highlight" or "error"
					end,
					weight = Enum.FontWeight.Bold,
					auto = "XY",

					{
						AnchorPoint = Vector2.new(0, 0.5),
						Position = px(UDim2.new(0, -22, 0.5, 0)),
					},
				},

				text {
					size = UDim2.fromScale(1, 1),
					text = function()
						local suggestions = analysis().suggestions
						if #suggestions == 0 then
							return ""
						end

						local selected = suggestions[selected_suggestion()]
						local suggested = autofill(raw_text(), selected.span, selected.replace, false)
						if suggested:sub(1, #raw_text()) ~= raw_text() then
							return ""
						end
						return suggested
					end,
					text_style = "subtext",
					xalignment = Enum.TextXAlignment.Left,
					zindex = -1,
				},

				-- syntax highlighted copy of the input, drawn over the textbox
				text {
					size = UDim2.fromScale(1, 1),
					text = function()
						return highlight(raw_text(), state.theme())
					end,
					rich_text = true,
					xalignment = Enum.TextXAlignment.Left,
					zindex = 2,

					{ Interactable = false },
				},

				textbox {
					placeholder = function()
						return if busy() then `Running {executing_command()}...` else "Enter command"
					end,
					xalignment = Enum.TextXAlignment.Left,

					text = raw_text,
					update_text = function(value)
						local pos = next_cursor_pos or cursor_pos()
						local last_char = string.sub(value, pos - 1, pos - 1)

						local suggested = analysis().suggestions
						if last_char == "\t" and suggested[1] then
							local selected = suggested[selected_suggestion()]
							value = autofill(raw_text(), selected.span, selected.replace, true)
						end
						raw_text(value)
					end,

					focused = state.focused,
					update_focused = state.focused,

					enter = function(value)
						local submitted = analysis()
						raw_text("")
						analysis(default_analysis)

						if #value:gsub("%s", "") == 0 then
							state.opened(false)
							return
						end

						task.delay(0.1, function()
							state.focused(true)
						end)

						cmd_history_index = 0
						table.insert(cmd_history, 1, value)

						local cmd = submitted.command
						if not cmd then
							log(value, {
								success = false,
								message = "Unknown command",
								timestamp = os.time(),
							})
							return
						end

						executing_command(cmd)
						executing(executing() + 1)

						local ok, result = pcall(
							centurion.execute_command,
							Players.LocalPlayer,
							cmd,
							submitted.argument and submitted.argument.text or {}
						)
						executing(executing() - 1)

						if not ok then
							warn(`Failed to execute '{value}': {result}`)
							log(value, {
								success = false,
								message = "Failed to execute command",
								timestamp = os.time(),
							})
							return
						end

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
					end,

					{
						AutomaticSize = Enum.AutomaticSize.None,
						Size = UDim2.fromScale(1, 1),
						CursorPosition = cursor_pos,
						-- the highlighted overlay draws the text, but hiding it completely would also hide the cursor
						TextTransparency = function()
							return if raw_text() == "" then 0 else 0.5
						end,

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
		},

		container {
			size = spring(function()
				local analysis_value = analysis()
				if analysis_value == nil then
					return UDim2.fromScale(1, 0)
				end

				return (
					not analysis_value.result.success
					or analysis_value.argument ~= nil
					or #analysis_value.suggestions > 0
				)
						and UDim2.fromScale(1, 1)
					or UDim2.fromScale(1, 0)
			end, 0.4),
			clip = true,

			-- keeps outlines from being clipped
			padding(1),

			create "UIListLayout" {
				SortOrder = Enum.SortOrder.LayoutOrder,
				Padding = px(UDim.new(0, 8)),
			},

			background {
				auto = "XY",
				visible = function()
					return display_analysis() and not display_analysis().result.success
				end,
				color = function()
					return state.theme().surface
				end,
				transparency = state.transparency,

				corner(px(4)),
				padding(px(8)),
				stroke {
					color = function()
						return state.theme().error
					end,
					transparency = 0.5,
				},
				catch_hover(),

				text {
					auto = "XY",
					text = function()
						return display_analysis().result.error or ""
					end,
					text_style = "error",
					xalignment = Enum.TextXAlignment.Left,
				},
			},
			suggestions {
				analysis = display_analysis,
				selected_suggestion = selected_suggestion,
				on_select = function(suggestion: types.AnalysisSuggestion)
					raw_text(autofill(raw_text(), suggestion.span, suggestion.replace, true))
				end,

				catch_hover(),
			},
		},
	}
end

return app
