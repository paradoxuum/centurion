-- finds the characters of `candidate` that match `query`, as inclusive ranges
local function match(query: string, candidate: string): { vector }
	if #query == 0 then
		return {}
	end

	local normalized_query = query:lower()
	local normalized_candidate = candidate:lower()

	local start = string.find(normalized_candidate, normalized_query, 1, true)
	if start then
		return { vector.create(start, start + #query - 1, 0) }
	end

	-- otherwise match each character in order, e.g. "tst" in "test"
	local ranges: { vector } = {}
	local pos = 1
	for i = 1, #normalized_query do
		local found = string.find(normalized_candidate, normalized_query:sub(i, i), pos, true)
		if not found then
			-- fuzzy matches (typos) don't line up with the input, so don't highlight anything
			return {}
		end

		local last = ranges[#ranges]
		if last and last.y == found - 1 then
			ranges[#ranges] = vector.create(last.x, found, 0)
		else
			table.insert(ranges, vector.create(found, found, 0))
		end
		pos = found + 1
	end

	return ranges
end

return match
