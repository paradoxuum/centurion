local argument = require("../../pkgs/centurion/src/argument")
require("../../pkgs/centurion/src/argument/duration")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local player = nil :: any

local function parse(text: string): number?
	local res = (argument.types.duration :: any).transform(text, player)
	return if res.success then res.value else nil
end

TEST("duration", function()
	CASE("single unit")
	CHECK(parse("10m") == 600)

	CASE("multiple units")
	CHECK(parse("1h30m") == 5400)
	CHECK(parse("1h 30m") == 5400)
	CHECK(parse("1h, 30m") == 5400)

	CASE("decimals")
	CHECK(parse("1.5h") == 5400)
	CHECK(parse(".5m") == 30)

	CASE("zero")
	CHECK(parse("0") == 0)

	CASE("trailing junk is rejected")
	CHECK(parse("10m garbage") == nil)
	CHECK(parse("1h, abc") == nil)

	CASE("unknown unit is rejected")
	CHECK(parse("5mx") == nil)

	CASE("missing unit is rejected")
	CHECK(parse("10") == nil)
	CHECK(parse("") == nil)
end)

return nil
