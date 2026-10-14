local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local analyse = require("./analyse")
local background = require("./components/background")
local centurion = require("../centurion")
local container = require("./components/container")
local corner = require("./components/corner")
local divider = require("./components/divider")
local fade = require("./fade")
local flex = require("./components/flex")
local header = require("@self/header")
local highlight = require("./analyse/highlight")
local history = require("@self/history")
local padding = require("./components/padding")
local preferred_input = require("./input")
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
local cleanup = vide.cleanup
local changed = vide.changed
local derive = vide.derive
local effect = vide.effect
local source = vide.source
local spring = vide.spring
local untrack = vide.untrack

local default_analysis = {
	result = {
		success = true,
		value = nil,
	},
	suggestions = {},
} :: types.AnalysisResult
local max_history_lines = 10
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

	-- touch devices draw a focused textbox with the native text field, which
	-- ignores TextTransparency and sits at a different offset, so the
	-- highlighted and suggested text overlays can't line up with it
	local preferred = preferred_input()
	local touch = derive(function()
		return preferred() == Enum.PreferredInput.Touch
	end)

	local next_cursor_pos = false
	local refocus_deadline = 0
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

	-- whether a space should follow the completed suggestion, so that the next
	-- token can be typed straight away
	local function needs_space(suggestion: types.AnalysisSuggestion): boolean
		if suggestion.kind == "command" then
			local cmd = centurion.registry.commands[suggestion.name]
			if cmd and cmd.arguments and select("#", cmd.arguments()) > 0 then
				return true
			end

			-- subcommands still have to be typed after it
			local prefix = suggestion.name .. " "
			for name in centurion.registry.commands do
				if name:sub(1, #prefix) == prefix then
					return true
				end
			end
			return false
		end

		local arg = analysis().argument
		if arg ~= nil then
			local cmd = centurion.registry.commands[analysis().command]
			local args = { cmd.arguments() }
			if arg.index == #args or arg.kind == "list" then
				return false
			end
		end
		return true
	end

	local function autofill(value: string, suggestion: types.AnalysisSuggestion, update_cursor_pos: boolean)
		local token, with = suggestion.span, suggestion.replace
		local span_start = token.x - 1
		local before = string.sub(value, 1, span_start)
		local after = string.sub(value, token.y + 1, -1)
		local space = if needs_space(suggestion) then " " else ""

		if update_cursor_pos then
			task.defer(cursor_pos, span_start + #with + #space + 1)
			selected_suggestion(1)
		end

		return before .. with .. space .. after
	end

	-- tapping a history entry or suggestion releases the textbox, but on touch
	-- devices FocusLost can fire after the button activates, which would undo
	-- an immediate refocus. so also recapture focus if it's lost shortly after
	local function refocus()
		refocus_deadline = os.clock() + 0.5
		state.focused(true)
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

		if state.opened() then
			if input.KeyCode == Enum.KeyCode.Up then
				handle_navigation(true)
			elseif input.KeyCode == Enum.KeyCode.Down then
				handle_navigation(false)
			end
		end

		if not activation_keys()[input.KeyCode] then
			return
		end

		local opened = not state.opened()
		state.opened(opened)
		state.focused(opened)
	end))

	-- refresh suggestions for leftover input whenever the console opens, which
	-- can also happen through the public open/toggle functions
	effect(function()
		if not state.opened() then
			return
		end

		untrack(function()
			local input_text = raw_text()
			if #input_text > 0 then
				analysis(analyse(input_text, #input_text + 1, state.max_suggestions()))
			end
		end)
	end)

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

			analysis(analyse(raw_text(), pos, state.max_suggestions()))
		end)
	end)

	local function submit(value: string)
		-- resolve from the submitted text rather than the analysis, which only
		-- carries arguments when the cursor happens to sit on one
		local submitted = centurion.resolve_command(value)
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

		local cmd = submitted.name
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

		-- pass the submitted text so that ctx.input keeps its original quoting
		local ok, result = pcall(centurion.execute_command, Players.LocalPlayer, cmd, submitted.args, value)
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
	end

	-- 0 when closed, 1 when open. The console fades and slides with it, and
	-- stays visible until it has finished closing
	local reveal = spring(function()
		return if state.opened() then 1 else 0
	end, 0.15)

	-- the popover only shows when there's something to say about the input
	local has_popover = derive(function()
		local value = analysis()
		return not value.result.success or value.argument ~= nil or #value.suggestions > 0
	end)
	local pop = spring(function()
		return if has_popover() then 1 else 0
	end, 0.12)

	-- created inside the console so that it fades with it
	local function input_field()
		return background {
			auto = "XY",
			size = UDim2.fromScale(1, 0),
			color = function()
				return state.theme().surface
			end,
			transparency = state.transparency,

			corner(px(6)),
			padding {
				y = px(8),
				left = px(function()
					return 34 + shake()
				end),
				right = px(function()
					return 10 - shake()
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

			-- the rest of the selected suggestion, shown after the input
			text {
				size = UDim2.fromScale(1, 1),
				text = function()
					local analysis_suggestions = analysis().suggestions
					if touch() or #analysis_suggestions == 0 then
						return ""
					end

					local selected = analysis_suggestions[selected_suggestion()]
					local suggested = autofill(raw_text(), selected, false)
					if suggested:sub(1, #raw_text()) ~= raw_text() then
						return ""
					end
					return suggested
				end,
				text_style = "subtext",
				transparency = 0.3,
				xalignment = Enum.TextXAlignment.Left,
				zindex = -1,
			},

			-- syntax highlighted copy of the input, drawn over the textbox
			text {
				size = UDim2.fromScale(1, 1),
				text = function()
					return if touch() then "" else highlight(raw_text(), state.theme())
				end,
				rich_text = true,
				xalignment = Enum.TextXAlignment.Left,
				zindex = 2,

				{ Interactable = false },
			},

			textbox {
				placeholder = function()
					return if busy() then `Running {executing_command()}...` else "Type a command"
				end,
				xalignment = Enum.TextXAlignment.Left,
				-- the highlighted overlay draws the text, but hiding it completely would also hide the cursor
				transparency = function()
					return if raw_text() == "" or touch() then 0 else 0.5
				end,

				text = raw_text,
				update_text = function(value)
					local pos = next_cursor_pos or cursor_pos()
					local last_char = string.sub(value, pos - 1, pos - 1)

					local suggested = analysis().suggestions
					if last_char == "\t" and suggested[1] then
						local selected = suggested[selected_suggestion()]
						value = autofill(raw_text(), selected, true)
					end
					raw_text(value)
				end,

				focused = state.focused,
				update_focused = function(focused)
					if focused then
						refocus_deadline = 0
					elseif os.clock() < refocus_deadline then
						-- the tap that selected an entry released the textbox, so take it back
						refocus_deadline = 0
						task.defer(state.focused, true)
					end
					state.focused(focused)
				end,

				enter = submit,

				{
					AutomaticSize = Enum.AutomaticSize.None,
					Size = UDim2.fromScale(1, 1),
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
		}
	end

	return fade.opacity(reveal, function()
		return container {
			auto = "Y",
			anchor = state.anchor,
			position = function()
				local offset = px.convert((reveal() - 1) * 12)
				return px.get(state.position) + UDim2.fromOffset(0, offset)
			end,
			size = px(function()
				local w = state.width()
				return UDim2.new(w.Scale, w.Offset, 0, 0)
			end),

			padding(px(12)),
			flex():row():gap(2),

			{
				Visible = function()
					return state.opened() or reveal() > 0.01
				end,
			},

			-- the console itself: header, history and input
			background {
				auto = "Y",
				size = UDim2.fromScale(1, 0),
				order = 1,
				color = function()
					return state.theme().background
				end,
				transparency = state.transparency,

				corner(px(10)),
				stroke {
					color = function()
						return theme.border(state.theme())
					end,
				},
				flex():row():fill("horizontal"),
				catch_hover(),

				header { order = 1 },
				divider { order = 2 },

				history {
					order = 3,
					max_lines = max_history_lines,
					on_select = function(command)
						cmd_history_index = 0
						raw_text(command)
						refocus()
						-- after the textbox has recaptured focus, move the cursor to the end
						task.defer(cursor_pos, #command + 1)
					end,
				},

				container {
					auto = "Y",
					size = UDim2.fromScale(1, 0),
					order = 4,

					padding(px(8)),

					input_field(),
				},
			},

			-- completion popover, dropping down from the input
			fade.opacity(function()
				return reveal() * pop()
			end, function()
				return container {
					auto = "XY",
					order = 2,

					padding {
						left = px(8),
						top = px(function()
							return 6 * pop()
						end),
					},

					{
						Visible = function()
							return pop() > 0.01
						end,
					},

					suggestions {
						analysis = display_analysis,
						selected_suggestion = selected_suggestion,
						on_select = function(suggestion: types.AnalysisSuggestion)
							raw_text(autofill(raw_text(), suggestion, true))
							refocus()
						end,

						catch_hover(),
					},
				}
			end),
		}
	end)
end

return app
