--!optimize 2
--!native

--[[
	levintine
	a port of fastest-levinstein to luau, with added functions for convenience
	https://github.com/ka-weihe/fastest-levenshtein
]]

type MapInfo = {
	case_sensitive: boolean?,
	min_score: number?,
}

local PEQ = table.create(0x10000, 0)
local DEFAULT_MIN_SCORE = -math.huge
local TCREATE = table.create
local RSHIFT = bit32.rshift
local LSHIFT = bit32.lshift
local SPLIT = string.split
local LOWER = string.lower
local FIND = string.find
local BYTE = string.byte
local SORT = table.sort
local CEIL = math.ceil
local XOR = bit32.bxor
local AND = bit32.band
local NOT = bit32.bnot
local OR = bit32.bor
local MIN = math.min

local function APPLY_CASE_SENSITIVITY(is_case_sensitive: boolean?, a: string, b: string): (string, string)
	if is_case_sensitive then
		return a, b
	else
		return LOWER(a), LOWER(b)
	end
end

local function GET_BYTES(s: string, len: number): { number }
	return { BYTE(s, 1, len) }
end

local function myers_32(a: string, b: string, a_len: number, b_len: number): number
	local lst = LSHIFT(1, a_len - 1)
	local a_bytes = GET_BYTES(a, a_len)
	local b_bytes = GET_BYTES(b, b_len)
	local sc = a_len
	local pv = -1
	local mv = 0

	-- Set the bits for characters in string a
	for j, a_byte in a_bytes do
		PEQ[a_byte] = OR(PEQ[a_byte], LSHIFT(1, j))
	end

	for _, byte in b_bytes do
		local eq = PEQ[byte]
		local xv = OR(eq, mv)
		local new_eq = OR(eq, XOR(AND(eq, pv) + pv, pv))
		local mv2 = OR(mv, NOT(OR(new_eq, pv)))
		local pv2 = AND(pv, new_eq)

		if AND(mv2, lst) ~= 0 then
			sc += 1
		end

		if AND(pv2, lst) ~= 0 then
			sc -= 1
		end

		local mv3 = OR(LSHIFT(mv2, 1), 1)
		pv = OR(LSHIFT(pv2, 1), NOT(OR(xv, mv3)))
		mv = AND(mv3, xv)
	end

	-- Reset the PEQ array
	for _, a_byte in a_bytes do
		PEQ[a_byte] = 0
	end

	return sc
end

local function myers_x(b: string, a: string, a_len: number, b_len: number): number
	local h_size = CEIL(a_len / 32)
	local v_size = CEIL(b_len / 32)
	local phc = TCREATE(h_size, -1)
	local mhc = TCREATE(h_size, 0)
	local a_bytes = GET_BYTES(a, a_len)
	local b_bytes = GET_BYTES(b, b_len)
	local v_min = MIN(32, b_len)
	local j_outside = 1

	for j = 1, v_size - 1 do
		local previous_j = j - 1
		local v_len = (v_min + previous_j) * 32
		local start = previous_j * 32
		local pv = -1
		local mv = 0
		j_outside += 1

		-- Set the bits for characters in string b
		for k = start + 1, v_len, -start do
			local b_byte = b_bytes[k]
			PEQ[b_byte] = OR(PEQ[b_byte], LSHIFT(1, k - start))
		end

		for index, byte in a_bytes do
			local index_32floor = (index // 32) + 1
			local index_32modulo = index % 32

			local phc_value = phc[index_32floor]
			local mhc_value = mhc[index_32floor]
			local eq = PEQ[byte]
			local pb = AND(RSHIFT(phc_value, index_32modulo), 1)
			local mb = AND(RSHIFT(mhc_value, index_32modulo), 1)
			local xv = OR(eq, mv)
			local xh = OR(XOR(AND(OR(OR(eq, mb), pv), pv) + pv, pv), eq, mb)
			local ph = OR(mv, NOT(OR(xh, pv)))
			local mh = AND(pv, xh)
			if XOR(RSHIFT(ph, 31), pb) == 1 then
				phc[index_32floor] = XOR(phc_value, LSHIFT(1, index_32modulo))
			end
			if XOR(RSHIFT(mh, 31), mb) == 1 then
				mhc[index_32floor] = XOR(mhc_value, LSHIFT(1, index_32modulo))
			end

			pv = OR(OR(LSHIFT(mh, 1), mb), NOT(OR(xv, ph)))
			mv = AND(OR(LSHIFT(ph, 1), pb), xv)
		end

		-- Reset the PEQ array for the current block
		for k = start + 1, v_len do
			PEQ[b_bytes[k]] = 0
		end
	end

	local start = (j_outside - 1) * 32
	local v_len = MIN(32, b_len - start) + start
	local pv = -1
	local mv = 0

	-- Set the bits for characters in string b
	for k = start + 1, v_len, -start do
		local byte = b_bytes[k]
		PEQ[byte] = OR(PEQ[byte], LSHIFT(1, k))
	end

	local score = b_len

	for index, byte in a_bytes do
		local index_32floor = (index // 32) + 1
		local index_32modulo = index % 32

		local phc_value = phc[index_32floor]
		local mhc_value = mhc[index_32floor]
		local eq = PEQ[byte]
		local pb = AND(RSHIFT(phc_value, index_32modulo), 1)
		local mb = AND(RSHIFT(mhc_value, index_32modulo), 1)
		local xv = OR(eq, mv)
		local xh = OR(XOR(AND(OR(OR(eq, mb), pv), pv) + pv, pv), eq, mb)
		local ph = OR(mv, NOT(OR(xh, pv)))
		local mh = AND(pv, xh)
		local b_subbed = b_len - 1
		score += AND(RSHIFT(ph, b_subbed), 1) - AND(RSHIFT(mh, b_subbed), 1)

		if XOR(RSHIFT(ph, 31), pb) == 1 then
			phc[index_32floor] = XOR(phc_value, LSHIFT(1, index_32modulo))
		end

		if XOR(RSHIFT(mh, 31), mb) == 1 then
			mhc[index_32floor] = XOR(mhc_value, LSHIFT(1, index_32modulo))
		end

		pv = OR(OR(LSHIFT(mh, 1), mb), NOT(OR(xv, ph)))
		mv = AND(OR(LSHIFT(ph, 1), pb), xv)
	end

	-- Reset the PEQ array for the last block
	for k = start + 1, v_len do
		PEQ[b_bytes[k]] = 0
	end

	return score
end

--[[
	Scores `a` and `b` using levenstine distance to compare the strings

	```luau
	local score = leventine.score("meow", "mrrp")
	print(score) --> 4
	```
]]
local function score(a: string, b: string, case_sensitive: boolean?): number
	a, b = APPLY_CASE_SENSITIVITY(case_sensitive, a, b)
	local a_len = #a
	local b_len = #b

	if a_len < b_len then
		a_len, b_len = b_len, a_len
		a, b = b, a
	end

	if b_len == 0 then
		return a_len
	elseif a_len <= 32 then
		return myers_32(a, b, a_len, b_len)
	else
		return myers_x(a, b, a_len, b_len)
	end
end

local leventine = {
	score = score,
}

--[[
	Gives a copy of `t` sorted based on highest to lowest score when scored aginst `s`

	```luau
	local mapped = leventine.map("meow", { "mrrp", "mrow", "miaow" })
	print(table.concat(mapped, ", ")) --> "mrow, mrrp, miaow"
	```
]]
function leventine.map(s: string, t: { string }, info: MapInfo?): { string }
	local min_score = info and info.min_score or DEFAULT_MIN_SCORE
	local case_sensitive = info and info.case_sensitive or false
	local mapped = TCREATE(#t) :: { { string | number } }

	for index, ts in t do
		local score_val = (score(s, ts, case_sensitive))

		if score_val > min_score then
			mapped[index] = { score_val, ts } :: any
		end
	end

	SORT(mapped, function(a, b)
		return a[1] < b[1]
	end)

	for index, val in mapped do
		mapped[index] = val[2] :: any
	end

	return mapped :: any
end

--[[
	Checks if `a` is a subsequence of `b`

	```luau
	local has_match = leventine.has_match("meow", "mrrp")
	print(has_match) --> false
	```
]]
function leventine.has_match(a: string, b: string, case_sensitive: boolean?): boolean
	a, b = APPLY_CASE_SENSITIVITY(case_sensitive, a, b)
	local char_index: number? = 1

	for _, character in SPLIT(b) do
		char_index = FIND(a, character, char_index, true)

		if char_index then
			char_index += 1
		else
			return false
		end
	end
	return true
end

--[[
	Gives the closest string from `t` to `s`

	```luau
	local closest = leventine.closest("meow", { "mrrp", "mrow", "miaow" })
	print(closest) --> "mrow"
	```
]]
function leventine.closest(s: string, t: { string }, case_sensitive: boolean?): (string, number)
	local closest_score = math.huge
	local closest_string: string

	for _, ts in t do
		local score_val = score(s, ts, case_sensitive)

		if score_val < closest_score then
			closest_string = ts
			closest_score = score_val
		end
	end
	return closest_string, closest_score
end

return table.freeze(leventine)
