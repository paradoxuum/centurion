export type ParseResult = {
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

local function parse(text: string, split_char: string): ParseResult
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

		if not quote_char and c == split_char then
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

return parse
