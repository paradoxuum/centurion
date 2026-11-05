-- `tonumber`, but only for finite numbers. tonumber also accepts "inf", "nan"
-- and values like "1e999" that overflow to infinity, none of which make sense
-- as command input. NaN in particular passes any range check, since every
-- comparison with it is false
local function finite(text: string): number?
	local num = tonumber(text)
	if num == nil or num ~= num or num == math.huge or num == -math.huge then
		return nil
	end
	return num
end

return finite
