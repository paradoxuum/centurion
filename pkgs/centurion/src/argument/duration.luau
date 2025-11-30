local argument = require("./.")
local result = require("../result")
local types = require("../types")
local DAY_SECONDS = 86400
local YEAR_DAYS = 365.25
local units = {}

local function unit(value: number, names: { string })
	for _, name in names do
		units[name] = value
	end
end

unit(1, { "s", "sec", "second", "seconds" })
unit(60, { "m", "min", "minute", "minutes" })
unit(3600, { "h", "hr", "hour", "hours" })
unit(DAY_SECONDS, { "d", "day", "days" })
unit(DAY_SECONDS * 7, { "w", "wk", "week", "weeks" })
unit(DAY_SECONDS * (YEAR_DAYS / 12), { "mo", "month", "months" })
unit(DAY_SECONDS * YEAR_DAYS, { "y", "yr", "year", "years" })

local duration = argument.register("duration", {
	transform = function(value: string): types.Result
		if value == "0" then
			return result.success(0)
		end

		local total_seconds = 0
		for amount, unit_name in value:gmatch("(%d+)%s*([a-zA-Z]+)") do
			local unit_seconds = units[unit_name:lower()]
			if not unit_seconds then
				return result.error(`Invalid duration unit: {unit_name}`)
			end
			total_seconds += tonumber(amount) * unit_seconds
		end

		if total_seconds == 0 then
			return result.error(`Invalid duration format: {value}`)
		end

		return result.success(total_seconds)
	end,
	suggestions = function(_value: string, _executor: Player): { string }
		return {}
	end,
})

return duration :: types.ArgumentFn<number>
