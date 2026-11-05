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

local function score(normalized: string, key: string): number
	if key:sub(1, #normalized):lower() == normalized then
		return 1000 - (#key - #normalized)
	end

	local distance = leventine.score(normalized, key, false)
	return (1 - distance / math.max(#normalized, #key)) * 100 + subsequence_bonus(normalized, key:lower())
end

local function identity(candidate: any): { string }
	return { candidate }
end

-- returns the best matches, and how many there were before being limited.
-- `keys` gives the strings a candidate can be found by, and its best scoring
-- key ranks it. by default a candidate is its own only key
local function suggest<T>(
	input: string,
	candidates: { T },
	max_suggestions: number?,
	keys: ((candidate: T) -> { string })?
): ({ T }, number)
	if #input == 0 then
		if max_suggestions and #candidates > max_suggestions then
			return { unpack(candidates, 1, max_suggestions) }, #candidates
		end
		return candidates, #candidates
	end

	local get_keys = keys or identity
	local normalized = input:lower()
	local scored = {}
	for _, candidate in candidates do
		local best = MIN_SCORE
		for _, key in get_keys(candidate) do
			best = math.max(best, score(normalized, key))
		end

		if best > MIN_SCORE then
			table.insert(scored, { value = candidate, score = best })
		end
	end

	table.sort(scored, function(a, b)
		return a.score > b.score
	end)

	local mapped = {}
	for i = 1, math.min(max_suggestions or #scored, #scored) do
		table.insert(mapped, scored[i].value)
	end
	return mapped, #scored
end

return suggest
