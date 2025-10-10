local leventine = require("./leventine")

local MIN_SCORE = -math.huge

local function suggest(input: string, candidates: { string }, max_suggestions: number?): { string }
	if #input == 0 then
		return candidates
	end

	local normalized = input:lower()
	local scored = {}
	for _, candidate in candidates do
		local score = 0

		if candidate:sub(1, #normalized) == normalized then
			score = 1000 - (#candidate - #normalized)
		else
			score = leventine.score(normalized, candidate, false)
			score = (1 - score / math.max(#normalized, #candidate)) * 100
			if leventine.has_match(candidate, normalized, false) then
				score += 100
			end
		end

		if score > MIN_SCORE then
			table.insert(scored, { text = candidate, score = score })
		end
	end

	table.sort(scored, function(a, b)
		return a.score > b.score
	end)

	local mapped = {}
	for i = 1, math.min(max_suggestions or #scored, #scored) do
		table.insert(mapped, scored[i].text)
	end
	return mapped
end

return suggest
