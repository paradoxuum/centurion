local suggest = require("../../pkgs/centurion-ui/src/analyse/suggest")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

type Item = { text: string, aliases: { string } }

local function keys(item: Item): { string }
	local list = { item.text }
	for _, alias in item.aliases do
		table.insert(list, alias)
	end
	return list
end

TEST("suggest", function()
	CASE("strings are matched by themselves")
	local matches, total = suggest("te", { "zzz", "test", "teleport" })
	CHECK(total == 3 and matches[1] == "test" and matches[2] == "teleport")

	CASE("empty input keeps the original order")
	matches = suggest("", { "b", "a" })
	CHECK(matches[1] == "b" and matches[2] == "a")

	CASE("results are limited, but the total counts everything")
	matches, total = suggest("t", { "test", "tea", "toast" }, 2)
	CHECK(#matches == 2 and total == 3)

	local zed: Item = { text = "Zed", aliases = { "Kenji" } }
	local kestrel: Item = { text = "Kestrel", aliases = {} }
	local items = { kestrel, zed }

	CASE("a candidate is ranked by its best key")
	matches = suggest("kenj", items, nil, keys)
	CHECK(matches[1] == zed)

	CASE("candidates are returned as-is, not as their keys")
	matches = suggest("zed", items, nil, keys)
	CHECK(matches[1] == zed)
end)

return nil
