local Players = game:GetService("Players")

local centurion = require("../../centurion")
local rich = require("../rich")
local types = require("../types")

type Kind = "command" | "argument" | "string" | "invalid"

local function is_valid(raw: string, arg: centurion.Argument): boolean
	local arg_type = centurion.registry.types[arg.type]
	if not arg_type then
		return false
	end

	local parsed_text = {}
	for _, token in centurion.parse_text(raw, arg_type.kind == "single" and " " or ",").tokens do
		table.insert(parsed_text, token.text)
	end

	local ok, result
	if arg_type.kind == "single" then
		ok, result = pcall(arg_type.transform, parsed_text[1], Players.LocalPlayer)
	else
		ok, result = pcall(arg_type.transform, parsed_text, Players.LocalPlayer)
	end

	return ok and result.success
end

local function classify(text: string): { { span: vector, kind: Kind } }
	local parse_result = centurion.parse_text(text, " ")
	local tokens = parse_result.tokens
	local cmds = centurion.registry.commands

	local highlights = {}
	local function add(token: centurion.Token, kind: Kind)
		table.insert(highlights, { span = token.span, kind = kind })
	end

	local cmd_name: string? = nil
	local cmd_index = 0
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
		for _, token in tokens do
			add(token, "invalid")
		end
		return highlights
	end

	for i = 1, cmd_index do
		add(tokens[i], "command")
	end

	local cmd = cmds[cmd_name]
	local args: { centurion.Argument } = if cmd.arguments then { cmd.arguments() } else {}

	-- assign tokens to arguments the same way centurion.transform_args does
	local token_index = cmd_index + 1
	for i, arg in args do
		local num_args = arg.num_args or 1
		local last = if num_args == "rest" or i == #args then #tokens else token_index + num_args - 1

		for j = token_index, math.min(last, #tokens) do
			local token = tokens[j]
			local raw = text:sub(token.span.x, token.span.y)

			if not is_valid(raw, arg) then
				add(token, "invalid")
			elseif raw:match("^[\"']") then
				add(token, "string")
			else
				add(token, "argument")
			end
		end

		token_index = last + 1
	end

	-- extra input is ignored by commands without arguments
	for j = token_index, #tokens do
		add(tokens[j], "argument")
	end

	if parse_result.unclosed_quote and #highlights > 0 then
		highlights[#highlights].kind = "invalid"
	end

	return highlights
end

local function highlight(text: string, theme: types.Theme): string
	local colors: { [Kind]: Color3 } = {
		command = theme.highlight,
		argument = theme.text,
		string = theme.success,
		invalid = theme.error,
	}

	local out = {}
	local pos = 1
	for _, item in classify(text) do
		table.insert(out, rich.escape(text:sub(pos, item.span.x - 1)))
		table.insert(out, rich.color(rich.escape(text:sub(item.span.x, item.span.y)), colors[item.kind]))
		pos = item.span.y + 1
	end
	table.insert(out, rich.escape(text:sub(pos)))

	return table.concat(out)
end

return highlight
