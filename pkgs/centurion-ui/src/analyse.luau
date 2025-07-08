local function tokenize(text: string)
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
				-- table.insert(buf, text:sub(i + 1, i + 1))
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
					table.insert(tokens, vector.create(start, i, 0))
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

local function analyse(text: string)
	local tokens = tokenize(text)
	if #tokens == 0 then
		return nil
	end

	return {
		command = tokens[1],
		args = { select(2, unpack(tokens)) },
	}
end

return analyse
