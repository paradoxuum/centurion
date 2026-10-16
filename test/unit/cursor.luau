local argument = require("../../pkgs/centurion/src/argument")
local cursor = require("../../pkgs/centurion-ui/src/analyse/cursor")
local parse = require("../../pkgs/centurion/src/parse")
local result = require("../../pkgs/centurion/src/result")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

-- `|` marks the cursor
local function locate(text: string): (number, boolean)
	local pos = assert(text:find("|", 1, true))
	return cursor.locate(parse((text:gsub("|", "", 1)), " ").tokens, pos)
end

-- which argument the cursor is on, the way analyse finds it
local function arg_at(text: string, args: { any }): number?
	local pos = assert(text:find("|", 1, true))
	local tokens = parse((text:gsub("|", "", 1)), " ").tokens
	local slot, inserting = cursor.locate(tokens, pos)
	local ranges = argument.assign(args, if inserting then #tokens + 1 else #tokens)
	for i, range in ranges do
		if slot >= range.first and slot <= range.last then
			return i
		end
	end
	return nil
end

TEST("locate", function()
	CASE("on a token at its end")
	local slot, inserting = locate("ab| cd")
	CHECK(slot == 1 and not inserting)

	CASE("on a token at its start")
	slot, inserting = locate("ab |cd")
	CHECK(slot == 2 and not inserting)

	CASE("inside a token")
	slot, inserting = locate("ab c|d")
	CHECK(slot == 2 and not inserting)

	CASE("after the last token")
	slot, inserting = locate("ab cd |")
	CHECK(slot == 3 and inserting)

	CASE("between tokens")
	slot, inserting = locate("ab  |  cd")
	CHECK(slot == 2 and inserting)

	CASE("in empty input")
	slot, inserting = locate("|")
	CHECK(slot == 1 and inserting)

	CASE("on a quoted token")
	slot, inserting = locate('ab "c d|"')
	CHECK(slot == 2 and not inserting)
end)

local str = argument.register_type("cursor-string", {
	transform = function(text)
		return result.success(text)
	end,
})

TEST("argument under cursor", function()
	local args = { str("a"), argument.rest(str("b")) }

	CASE("rest points at the token under the cursor, not the last one")
	CHECK(arg_at("x |y z", args) == 2)
	CHECK(arg_at("x| y z", args) == 1)

	CASE("a fixed count spans its tokens")
	local fixed = { argument.num_args(str("p"), 2), str("q") }
	CHECK(arg_at("x y|", fixed) == 1)
	CHECK(arg_at("x y |", fixed) == 2)

	CASE("past the last argument is none")
	CHECK(arg_at("x y |", { str("a") }) == nil)
end)

return nil
