local Players = game:GetService("Players")

local centurion = require("../centurion")
local match = require("@self/match")
local suggest = require("@self/suggest")
local types = require("./types")

local function analyse(text: string, cursor_pos: number, max_suggestions: number?): types.AnalysisResult
	local resolution = centurion.resolve_command(text)
	local tokens = resolution.tokens

	if #tokens == 0 then
		return {
			result = {
				success = true,
				value = nil :: any,
			},
			suggestions = {},
		}
	end

	local cmds = centurion.registry.commands

	local cmd_name: string? = resolution.name
	local cmd_index: number? = cmd_name and resolution.name_end or nil

	local arg_tokens: { centurion.Token } = cmd_index and { select(2, unpack(tokens, cmd_index)) } or {}

	local at_arg = false
	if cmd_index and cursor_pos - 1 > tokens[cmd_index].span.y then
		at_arg = true
	end

	local function process_arg(): types.AnalysisResult?
		if not cmd_name then
			return nil
		end

		if not cmd_index then
			return nil
		end

		local cmd = cmds[cmd_name]
		if not cmd then
			return nil
		end

		local cmd_args: { centurion.Argument } = cmd.arguments and { cmd.arguments() } or {}
		local arg_text = resolution.args

		-- commands taking no arguments have nothing to suggest, but still
		-- reject extra input
		if #cmd_args == 0 then
			if #arg_tokens == 0 then
				return nil
			end

			return {
				result = centurion.transform_args(Players.LocalPlayer, arg_text, cmd_args),
				suggestions = {},
			}
		end

		local transform_result = centurion.transform_args(Players.LocalPlayer, arg_text, cmd_args)

		if not at_arg then
			return {
				result = transform_result,
				suggestions = {},
			}
		end

		local arg_index = 1
		local input_index = 0
		for i, arg in cmd_args do
			local num_args = arg.num_args or 1

			local start_token = arg_tokens[input_index] or tokens[cmd_index]

			local range_end = 0
			if type(num_args) == "number" then
				range_end = input_index + num_args
			else
				range_end = #arg_tokens
			end

			for j = input_index + 1, range_end do
				if not arg_tokens[j] then
					if j == 1 or cursor_pos - 1 > arg_tokens[j - 1].span.y then
						input_index += 1
					end

					break
				end

				input_index = j
			end

			local end_token = arg_tokens[input_index]
			if
				(not end_token or i == #cmd_args or cursor_pos - 1 <= end_token.span.y)
				and cursor_pos - 1 >= start_token.span.x
			then
				arg_index = i
				break
			end
		end

		local arg = cmd_args[arg_index]
		local arg_type = centurion.registry.types[arg.type]
		assert(arg_type, "Unknown argument type: " .. tostring(arg.type))

		local input_token: centurion.Token? = arg_tokens[input_index]

		if not input_token then
			local prev_token = tokens[cmd_index + math.min(input_index, #arg_tokens)]
			input_token = {
				span = vector.create(prev_token.span.y + 2, prev_token.span.y + 2, 0),
				text = "",
			}
		end

		if arg_type.kind == "list" then
			local parsed_token = centurion.parse_text(text:sub(input_token.span.x, input_token.span.y), ",")

			local at_list_token = false
			for _, t in parsed_token.tokens do
				if t.span.y + input_token.span.x - 1 >= cursor_pos - 1 then
					at_list_token = true
					input_token = {
						span = vector.create(t.span.x + input_token.span.x - 1, t.span.y + input_token.span.x - 1, 0),
						text = t.text,
					}
					break
				end
			end

			if not at_list_token and #parsed_token.tokens > 0 then
				local last_token = parsed_token.tokens[#parsed_token.tokens]
				input_token = {
					span = vector.create(
						last_token.span.y + input_token.span.x + 1,
						last_token.span.y + input_token.span.x + 1,
						0
					),
					text = "",
				}
			end
		end

		local arg_suggestions: { string } = {}
		if arg_type.suggestions then
			arg_suggestions = arg_type.suggestions(input_token and input_token.text or "", Players.LocalPlayer)
		end

		if arg.suggestions then
			for _, suggestion in arg.suggestions do
				table.insert(arg_suggestions, suggestion)
			end
		end

		-- check for duplicates
		local seen = {}
		for i = #arg_suggestions, 1, -1 do
			local suggestion = arg_suggestions[i]
			if seen[suggestion] then
				table.remove(arg_suggestions, i)
			else
				seen[suggestion] = true
			end
		end

		local suggestions = {}
		if #arg_suggestions > 0 then
			local matches = suggest(input_token.text, arg_suggestions, max_suggestions)

			for _, suggestion_text in matches do
				local replacement = ""
				local replacement_text = {}
				for _, replacement_token in centurion.parse_text(suggestion_text, " ").tokens do
					table.insert(replacement_text, replacement_token.text)
				end

				if #replacement_text == 1 then
					replacement = replacement_text[1]
				else
					replacement = '"' .. table.concat(replacement_text, " ") .. '"'
				end

				local suggestion = {
					kind = "argument",
					name = suggestion_text,
					matches = match(input_token.text, suggestion_text),

					span = input_token.span,
					replace = replacement,
				} :: types.AnalysisSuggestion
				table.insert(suggestions, suggestion)
			end
		end

		return {
			result = transform_result,
			argument = {
				text = arg_text,
				index = arg_index,
				type = arg.type,
				kind = arg_type.kind,
			},
			suggestions = suggestions,
		} :: types.AnalysisResult
	end

	local function process_command(): types.AnalysisResult
		local to_match = {}
		for k, _ in cmds do
			if k == cmd_name then
				continue
			end
			table.insert(to_match, k)
		end

		local token_text = {}
		for _, token in tokens do
			table.insert(token_text, token.text)
		end

		local query = table.concat(token_text, " ")
		local matches = suggest(query, to_match, max_suggestions)
		if cmd_name then
			table.insert(matches, 1, cmd_name)
		end

		local result: centurion.Result
		if cmd_name then
			result = {
				success = true,
				value = nil :: any,
			}
		else
			result = {
				success = false :: false,
				error = "Unknown command",
			}
		end

		local suggestions = {}
		for _, cmd_match in matches do
			local suggestion = {
				kind = "command",
				name = cmd_match,
				description = cmds[cmd_match].description,
				matches = match(query, cmd_match),

				span = vector.create(1, tokens[#tokens].span.y, 0),
				replace = cmd_match,
			} :: types.AnalysisSuggestion
			table.insert(suggestions, suggestion)
		end

		return {
			result = result,
			suggestions = suggestions,
		} :: types.AnalysisResult
	end

	local analysis_result: centurion.Result

	local arg_result = process_arg()
	local cmd_result = process_command()
	if resolution.unclosed_quote then
		analysis_result = {
			success = false,
			error = "Unclosed quote at position " .. tokens[#tokens].span.x,
		}
	else
		if arg_result then
			analysis_result = arg_result.result
		else
			analysis_result = cmd_result.result
		end
	end

	local final_suggestions = cmd_result.suggestions
	if at_arg and arg_result then
		final_suggestions = arg_result.suggestions

		-- a subcommand shares the position of its parent's first argument, so
		-- both sets are offered there instead of the argument replacing them
		local on_first_arg = arg_result.argument == nil or arg_result.argument.index == 1
		if cmd_name and on_first_arg then
			local prefix = cmd_name .. " "
			local merged = {}

			for _, suggestion in cmd_result.suggestions do
				if suggestion.name ~= cmd_name and suggestion.name:sub(1, #prefix) == prefix then
					table.insert(merged, suggestion)
				end
			end

			if #merged > 0 then
				for _, suggestion in final_suggestions do
					table.insert(merged, suggestion)
				end

				if max_suggestions then
					for i = #merged, max_suggestions + 1, -1 do
						merged[i] = nil
					end
				end

				final_suggestions = merged
			end
		end
	end

	return {
		result = analysis_result,
		command = cmd_name,
		argument = arg_result and arg_result.argument or nil,
		suggestions = final_suggestions,
	}
end

return analyse
