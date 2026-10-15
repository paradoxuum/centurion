local leventine = require("../../pkgs/centurion-ui/src/analyse/leventine")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

TEST("has_match", function()
	CASE("matches a non-contiguous subsequence")
	CHECK(leventine.has_match("roles get", "rgt"))

	CASE("matches a contiguous substring")
	CHECK(leventine.has_match("teleport", "port"))

	CASE("matches an empty input")
	CHECK(leventine.has_match("kick", ""))

	CASE("rejects characters out of order")
	CHECK(not leventine.has_match("kick", "kci"))

	CASE("rejects a repeated character used once in the candidate")
	CHECK(not leventine.has_match("kick", "kkk"))

	CASE("rejects characters the candidate lacks")
	CHECK(not leventine.has_match("meow", "mrrp"))

	CASE("ignores case by default")
	CHECK(leventine.has_match("Teleport", "TP"))

	CASE("respects case when asked")
	CHECK(not leventine.has_match("Teleport", "tp", true))
end)

return nil
