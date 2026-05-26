local Players = game:GetService("Players")

local centurion = require("../centurion")
local suggest = require("@self/suggest")
local types = require("./types")

local function analyse(text: string, cursor_pos: number, max_suggestions: number?): types.AnalysisResult
	local parse_result = centurion.parse_text(text, " ")
	local tokens = parse_result.tokens

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

	local cmd_name: string? = nil
	local cmd_index: number? = nil

	local cmd_text = {}
	for i, token in tokens do
		table.insert(cmd_text, token.text)

		local name = table.concat(cmd_text, " ")
		if cmds[name] then
			cmd_name = name
			cmd_index = i
			break
		end
	end

	if not cmd_name then
		cmd_text = {}
	end

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
		local cmd_args: { centurion.Argument } = cmd.arguments and { cmd.arguments() } or {}
		if not cmd or #cmd_args == 0 then
			return nil
		end

		local arg_text = {}
		for _, token in arg_tokens do
			table.insert(arg_text, text:sub(token.span.x, token.span.y))
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

			for _, match in matches do
				local replacement = ""
				local replacement_text = {}
				for _, replacement_token in centurion.parse_text(match, " ").tokens do
					table.insert(replacement_text, replacement_token.text)
				end

				if #replacement_text == 1 then
					replacement = replacement_text[1]
				else
					replacement = '"' .. table.concat(replacement_text, " ") .. '"'
				end

				local suggestion = {
					kind = "argument",
					name = match,

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

		local matches = suggest(table.concat(token_text, " "), to_match, max_suggestions)
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
		for _, match in matches do
			local suggestion = {
				kind = "command",
				name = match,
				description = cmds[match].description,

				span = vector.create(1, tokens[#tokens].span.y, 0),
				replace = match,
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
	if parse_result.unclosed_quote then
		analysis_result = {
			success = false,
			error = "Unclosed quote at position " .. parse_result.tokens[#parse_result.tokens].span.x,
		}
	else
		if arg_result then
			analysis_result = arg_result.result
		else
			analysis_result = cmd_result.result
		end
	end

	return {
		result = analysis_result,
		command = cmd_name,
		argument = arg_result and arg_result.argument or nil,
		suggestions = (at_arg and arg_result) and arg_result.suggestions or cmd_result.suggestions,
	}
end

return analyse
