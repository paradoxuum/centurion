local testkit = require("./testkit").test()

local FINISH = testkit.FINISH

-- every test file returns nil. the luau cli's require doesn't raise when a
-- module fails to load, it returns the error message instead, which would
-- otherwise silently drop all of that file's tests
local function loaded(name: string, result: unknown)
	if result ~= nil then
		error(`Failed to load test file '{name}': {result}`, 0)
	end
end

loaded("analyse", require("./analyse"))
loaded("argument", require("./argument"))
loaded("command", require("./command"))
loaded("cursor", require("./cursor"))
loaded("duration", require("./duration"))
loaded("leventine", require("./leventine"))
loaded("limit", require("./limit"))
loaded("log", require("./log"))
loaded("parse", require("./parse"))
loaded("player", require("./player"))
loaded("resolve", require("./resolve"))
loaded("suggest", require("./suggest"))
loaded("sync", require("./sync"))
loaded("user", require("./user"))

-- FINISH returns the number of failures clamped to 0 or 1. a plain truthiness
-- check would never fail, since 0 is truthy
local fails = FINISH()
if fails ~= 0 then
	error("Tests failed", 0)
end
