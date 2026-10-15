local fakes = require("./fakes")

local limit = require("../../pkgs/centurion/src/limit")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local carol = fakes.add_player("Carol")

local now = 0
limit.clock = function()
	return now
end

limit.set_options({ rate = 1, burst = 3, max_args = 2, max_arg_length = 5, max_input_length = 10 })

TEST("rate limit", function()
	limit.reset()

	CASE("burst is allowed")
	CHECK(limit.check(carol, "a") == nil)
	CHECK(limit.check(carol, "a") == nil)
	CHECK(limit.check(carol, "a") == nil)

	CASE("requests beyond the burst are rejected")
	CHECK(limit.check(carol, "a") ~= nil)

	CASE("tokens refill over time")
	now += 1
	CHECK(limit.check(carol, "a") == nil)
	CHECK(limit.check(carol, "a") ~= nil)

	CASE("refill is capped at the burst")
	now += 100
	CHECK(limit.check(carol, "a") == nil)
	CHECK(limit.check(carol, "a") == nil)
	CHECK(limit.check(carol, "a") == nil)
	CHECK(limit.check(carol, "a") ~= nil)

	CASE("leaving clears the bucket")
	fakes.remove_player(carol)
	CHECK(limit.check(carol, "a") == nil)
end)

TEST("size caps", function()
	CASE("within limits passes")
	limit.reset()
	CHECK(limit.check(carol, "kick", { "bob", "spam" }, "kick bob") == nil)

	CASE("long command name is rejected")
	limit.reset()
	CHECK(limit.check(carol, "toolong") ~= nil)

	CASE("too many arguments is rejected")
	limit.reset()
	CHECK(limit.check(carol, "a", { "1", "2", "3" }) ~= nil)

	CASE("long argument is rejected")
	limit.reset()
	CHECK(limit.check(carol, "a", { "toolong" }) ~= nil)

	CASE("long input is rejected")
	limit.reset()
	CHECK(limit.check(carol, "a", {}, "much too long") ~= nil)
end)

TEST("options", function()
	CASE("unknown option is rejected")
	CHECK(not pcall(limit.set_options, { nope = 1 } :: any))

	CASE("non-positive value is rejected")
	CHECK(not pcall(limit.set_options, { rate = 0 }))
end)

return nil
