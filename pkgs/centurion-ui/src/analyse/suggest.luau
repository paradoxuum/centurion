local leventine = require("./leventine")

local MIN_SCORE = -math.huge
local SUBSEQUENCE_BONUS = 100

local function word_start(candidate: string, pos: number): boolean
	return pos == 1 or string.find(string.sub(candidate, pos - 1, pos - 1), "[%s_%-]") ~= nil
end

-- rewards the query's characters appearing in order in the candidate, by how
-- tightly they're packed and whether they start a word. a flat bonus would
-- rank loose matches like "rsp" in "forcespawn" above close typos like "esp"
local function subsequence_bonus(query: string, candidate: string): number
	local first = string.sub(query, 1, 1)
	local best = 0

	local start = string.find(candidate, first, 1, true)
	while start do
		local pos = start
		for i = 2, #query do
			local found = string.find(candidate, string.sub(query, i, i), pos + 1, true)
			if not found then
				-- later starts can't match either
				return best
			end
			pos = found
		end

		local tightness = #query / (pos - start + 1)
		-- abbreviations skip a lot, e.g. "tp" for "teleport", so don't punish gaps too hard
		local bonus = SUBSEQUENCE_BONUS * tightness ^ 1.5
		if not word_start(candidate, start) then
			bonus /= 2
		end
		best = math.max(best, bonus)

		start = string.find(candidate, first, start + 1, true)
	end

	return best
end

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
			score += subsequence_bonus(normalized, candidate:lower())
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
