--!strict

type Token = {
	read span: vector,
}

-- finds the token the cursor is on
local function locate(tokens: { read [number]: Token }, cursor_pos: number): (number, boolean)
	local before = 0
	for i, token in tokens do
		if cursor_pos >= token.span.x and cursor_pos <= token.span.y + 1 then
			return i, false
		end

		if token.span.y + 1 < cursor_pos then
			before = i
		end
	end

	return before + 1, true
end

return {
	locate = locate,
}
