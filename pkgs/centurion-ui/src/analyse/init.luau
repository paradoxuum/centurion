local Players = game:GetService("Players")

local centurion = require("../centurion")
local leventine = require("@self/leventine")
local types = require("./types")

local function parse(text: string)
	local tokens = {}
	local i = 1

	local start = nil
	local in_quote = false
	local quote_char = ""

	local len = #text
	while i <= len do
		local c = text:sub(i, i)
		if in_quote then
			if c == "\\" and i + 1 <= len then
				-- escape next char
				i += 2
				continue
			elseif c == quote_char then
				in_quote = false
				i += 1
				continue
			end
		else
			if c == '"' or c == "'" then
				in_quote = true
				quote_char = c
				if start == nil then
					start = i
				end
			elseif c == " " then
				if start ~= nil then
					table.insert(tokens, vector.create(start, i - 1, 0))
					start = nil
				end
			else
				if start == nil then
					start = i
				end
			end
		end

		i += 1
	end

	if start ~= nil then
		table.insert(tokens, vector.create(start, len, 0))
	end

	return tokens
end

local function has_required_args(args): boolean
	for _, arg in args do
		if not arg.optional then
			return true
		end
	end
	return false
end

local function analyse(text: string, cursor_pos: number): types.AnalysisResult
	local tokens = parse(text)
	if #tokens == 0 then
		return {
			result = {
				success = true,
			},
			suggestions = {},
		}
	end

	local cmds = centurion.command.commands

	local cmd_name = nil
	local cmd_index = nil

	for i, token in tokens do
		local name = text:sub(1, token.y)
		if cmds[name] then
			cmd_name = name
			cmd_index = i
			break
		end
	end

	local cursor_token = tokens[#tokens]
	for _, token in tokens do
		if token.x <= cursor_pos - 1 and token.y >= cursor_pos - 1 then
			cursor_token = token
			break
		end
	end

	local arg_tokens = cmd_index and { select(2, table.unpack(tokens, cmd_index)) } or {}

	local at_arg = false
	if cmd_index and cursor_pos - 1 > tokens[cmd_index].y then
		at_arg = true
	end

	local function process_arg(): types.AnalysisResult?
		local cmd = cmds[cmd_name]
		if not cmd or not cmd.arguments or #cmd.arguments == 0 then
			return nil
		end

		local arg_text = {}
		for _, token in arg_tokens do
			table.insert(arg_text, text:sub(token.x, token.y))
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

			local start_token = arg_tokens[input_index] or vector.create(0, 0, 0)
			if type(num_args) == "number" then
				input_index += num_args
			else
				input_index = #arg_tokens
			end
			local end_token = arg_tokens[input_index]

			if
				(not end_token or i == #cmd_args or cursor_pos - 1 <= end_token.y)
				and cursor_pos - 1 >= start_token.x
			then
				arg_index = i
				break
			end
		end

		local arg = cmd_args[arg_index]
		local arg_type = centurion.arg.types[arg.type]
		local input_token = arg_tokens[input_index]

		local arg_suggestions = arg_type.suggestions
				and arg_type.suggestions(
					input_token and text:sub(input_token.x, input_token.y) or "",
					Players.LocalPlayer
				)
			or {}

		if arg.suggestions then
			for _, suggestion in arg.suggestions do
				table.insert(arg_suggestions, suggestion)
			end
		end

		local suggestions = {}
		if #arg_suggestions > 0 then
			local matches = leventine.map(text:sub(1, tokens[#tokens].y), arg_suggestions, {
				case_sensitive = false,
			})

			for _, match in matches do
				local suggestion = {
					kind = "argument",
					name = match,

					token = input_token or vector.create(0, 0, 0),
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

		local matches = leventine.map(text:sub(1, tokens[#tokens].y), to_match, {
			case_sensitive = false,
		})
		if cmd_name then
			table.insert(matches, 1, cmd_name)
		end

		local result: types.AnalysisResult
		if cmd_name then
			result = {
				success = true,
			}
		else
			result = {
				success = false,
				error = "Unknown command",
			}
		end

		local suggestions = {}
		for _, match in matches do
			local token = tokens[#tokens]
			local suggestion = {
				kind = "command",
				name = match,
				description = cmds[match].description,

				token = token,
				replace = match,
			} :: types.AnalysisSuggestion
			table.insert(suggestions, suggestion)
		end

		return {
			result = result,
			suggestions = suggestions,
		} :: types.AnalysisResult
	end

	local arg_result = process_arg()
	local cmd_result = process_command()

	return {
		result = arg_result and arg_result.result or cmd_result.result,
		command = cmd_name,
		argument = arg_result and arg_result.argument or nil,
		arguments = arg_result and arg_result.arguments or nil,
		suggestions = (at_arg and arg_result) and arg_result.suggestions or cmd_result.suggestions,
	}
end

return analyse
