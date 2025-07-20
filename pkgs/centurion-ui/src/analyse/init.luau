local Players = game:GetService("Players")

local centurion = require("../centurion")
local leventine = require("@self/leventine")
local types = require("./types")

type ParseResult = {
	tokens: { Token },
	unclosed_quote: boolean,
}

export type Token = {
	span: vector,
	text: string,
}

local function parse_escaped_char(c: string): string
	if c == "n" then
		return "\n"
	elseif c == "t" then
		return "\t"
	elseif c == "r" then
		return "\r"
	elseif c == "\\" then
		return "\\"
	elseif c == '"' then
		return '"'
	elseif c == "'" then
		return "'"
	end

	return c
end

local function parse(text: string): ParseResult
	local tokens: { Token } = {}

	local start = nil
	local escaped = false
	local quote_char: string?
	local current = ""

	for i = 1, #text do
		local c = text:sub(i, i)

		if escaped then
			if start == nil then
				start = i - 1
			end

			current = current .. parse_escaped_char(c)
			escaped = false
			continue
		end

		if c == "\\" then
			escaped = true
			continue
		end

		if (c == '"' or c == "'") and not quote_char then
			quote_char = c
			if start == nil then
				start = i
			end
			continue
		end

		if c == quote_char then
			quote_char = nil
			continue
		end

		if not quote_char and c == " " then
			if start ~= nil then
				table.insert(tokens, {
					span = vector.create(start, i - 1, 0),
					text = current,
				})
				start = nil
				current = ""
			end
			continue
		end

		if start == nil then
			start = i
		end

		current = current .. c
	end

	if start ~= nil then
		table.insert(tokens, {
			span = vector.create(start, #text, 0),
			text = current,
		})
	end

	return {
		tokens = tokens,
		unclosed_quote = quote_char ~= nil,
	}
end

local function analyse(text: string, cursor_pos: number): types.AnalysisResult
	local parse_result = parse(text)
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

	local cmds = centurion.command.commands

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

	local arg_tokens: { Token } = cmd_index and { select(2, unpack(tokens, cmd_index)) } or {}

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
		if not cmd or not cmd.arguments or #cmd.arguments == 0 then
			return nil
		end

		local arg_text = {}
		for _, token in arg_tokens do
			table.insert(arg_text, token.text)
		end

		local cmd_args = cmd.arguments
		local transform_result = centurion.arg.transform(Players.LocalPlayer, arg_text, cmd_args)

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
		local arg_type = centurion.arg.types[arg.type]
		local input_token = arg_tokens[input_index]

		local arg_suggestions = arg_type.suggestions
				and arg_type.suggestions(input_token and input_token.text or "", Players.LocalPlayer)
			or {}

		if arg.suggestions then
			for _, suggestion in arg.suggestions do
				table.insert(arg_suggestions, suggestion)
			end
		end

		local suggestions = {}
		if #arg_suggestions > 0 then
			local matches = leventine.map(input_token and input_token.text or "", arg_suggestions, {
				case_sensitive = false,
			})

			local token = input_token
			if not token then
				local prev_token = tokens[cmd_index + math.min(input_index, #arg_tokens)]
				token = {
					span = vector.create(prev_token.span.y + 2, prev_token.span.y + 2, 0),
					text = "",
				}
			end

			for _, match in matches do
				local suggestion = {
					kind = "argument",
					name = match,

					span = token.span,
					replace = match,
				} :: types.AnalysisSuggestion
				table.insert(suggestions, suggestion)
			end
		end

		return {
			result = transform_result,
			argument = arg_index,
			arguments = arg_text,
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

		local parsed_text = ""
		for _, token in tokens do
			parsed_text = parsed_text .. token.text .. " "
		end

		local matches = leventine.map(parsed_text, to_match, {
			case_sensitive = false,
		})
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
		arguments = arg_result and arg_result.arguments or nil,
		suggestions = (at_arg and arg_result) and arg_result.suggestions or cmd_result.suggestions,
	}
end

return analyse
