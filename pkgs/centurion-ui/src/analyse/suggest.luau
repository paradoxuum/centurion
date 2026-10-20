local leventine = require("./leventine")

local MIN_SCORE = -math.huge

-- returns the best matches, and how many there were before being limited
local function suggest(input: string, candidates: { string }, max_suggestions: number?): ({ string }, number)
	if #input == 0 then
		if max_suggestions and #candidates > max_suggestions then
			return { unpack(candidates, 1, max_suggestions) }, #candidates
		end
		return candidates, #candidates
	end

	local normalized = input:lower()
	local scored = {}
	for _, candidate in candidates do
		local score = 0

		if candidate:sub(1, #normalized):lower() == normalized then
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
	return mapped, #scored
end

return suggest
