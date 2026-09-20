local command = require("./command")
local parse = require("./parse")

export type Resolution = {
	-- the resolved command, or nil if the input doesn't name one
	name: string?,
	-- index of the last token making up the command name, 0 if unresolved
	name_end: number,
	args: { string },
	tokens: { parse.Token },
	unclosed_quote: boolean,
}

--[[
	Resolves command input into a registered command name and its arguments.

	Command names may contain spaces, so the longest registered name wins:
	with both `roles` and `roles get` registered, `roles get Player` resolves to
	`roles get`.

	A quoted token is literal text and can never form part of a
	name, so `roles "get"` resolves to `roles` with `get` as its argument.
]]
local function resolve(text: string): Resolution
	local parse_result = parse(text, " ")
	local tokens = parse_result.tokens

	local name: string? = nil
	local name_end = 0

	local candidate = {}
	for i, token in tokens do
		if token.quoted then
			break
		end

		table.insert(candidate, token.text)

		local candidate_name = table.concat(candidate, " ")
		if command.commands[candidate_name] then
			name = candidate_name
			name_end = i
		end
	end

	local args = {}
	for i = name_end + 1, #tokens do
		local token = tokens[i]
		table.insert(args, text:sub(token.span.x, token.span.y))
	end

	return {
		name = name,
		name_end = name_end,
		args = args,
		tokens = tokens,
		unclosed_quote = parse_result.unclosed_quote,
	}
end

return resolve
