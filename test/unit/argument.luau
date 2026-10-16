local argument = require("../../pkgs/centurion/src/argument")
local result = require("../../pkgs/centurion/src/result")
local testkit = require("./testkit").test()
local types = require("../../pkgs/centurion/src/types")

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local string_arg = argument.register_type("test-string", {
	transform = function(text)
		return result.success(text)
	end,
})

local number_arg = argument.register_type("test-number", {
	transform = function(text): types.Result<number>
		local n = tonumber(text)
		if not n then
			return result.error(`'{text}' is not a number`)
		end
		return result.success(n)
	end,
})

local boolean_arg = argument.register_type("test-boolean", {
	transform = function(text): types.Result<boolean>
		if text == "true" then
			return result.success(true)
		elseif text == "false" then
			return result.success(false)
		end
		return result.error(`'{text}' is not a boolean`)
	end,
})

local player = nil :: any

local function run(input: { string }, args: { any })
	return argument.transform(player, input, args)
end

TEST("the last argument is not greedy", function()
	local res = run({ "a", "b", "c" }, { string_arg("first"), string_arg("second") })

	CASE("excess input is rejected")
	CHECK(not res.success)

	CASE("excess error names the limit")
	CHECK(not res.success and res.error == "Expected at most 2 arguments, got 3")
end)

TEST("exact arity", function()
	local res = run({ "a", "b" }, { string_arg("first"), string_arg("second") })

	CASE("succeeds")
	CHECK(res.success)

	CASE("values are in order")
	CHECK(res.success and res.value[1] == "a" and res.value[2] == "b")
end)

TEST("rest", function()
	local res = run({ "a", "b", "c" }, { argument.rest(string_arg("tags")) })

	CASE("consumes all remaining input")
	CHECK(res.success and #res.value[1] == 3)
end)

TEST("optional arguments", function()
	local res = run({ "1", "2" }, { number_arg("a"), argument.optional(number_arg("b")), number_arg("c") })

	CASE("optional before required reports missing")
	CHECK(not res.success)

	CASE("missing error names the argument")
	CHECK(not res.success and res.error == "Missing required argument: c")

	res = run({ "1" }, { number_arg("a"), argument.optional(number_arg("b")) })

	CASE("trailing optional may be omitted")
	CHECK(res.success and res.value[1] == 1 and res.value[2] == nil)
end)

TEST("boolean", function()
	local res = run({ "false" }, { boolean_arg("flag") })

	CASE("false survives transform")
	CHECK(res.success and res.value[1] == false)
end)

TEST("error messages", function()
	local res = run({ "abc" }, { number_arg("count") })

	CASE("names the argument")
	CHECK(not res.success and res.error == "Invalid value for 'count': 'abc' is not a number")

	res = run({ "1", "x", "3" }, { argument.num_args(number_arg("point"), 3) })

	CASE("multi-value error includes position")
	CHECK(not res.success and res.error == "Invalid value #2 for 'point': 'x' is not a number")
end)

TEST("fixed-count arguments", function()
	local res = run({ "1", "2" }, { argument.num_args(number_arg("point"), 3) })

	CASE("insufficient values error instead of crashing")
	CHECK(not res.success)

	CASE("insufficient values message")
	CHECK(not res.success and res.error == "Expected 3 values for 'point', got 2")

	res = run({ "1", "2", "tail" }, { argument.num_args(number_arg("pair"), 2), string_arg("name") })

	CASE("a middle multi-value argument stops at its count")
	CHECK(res.success)

	CASE("the following argument gets its value")
	CHECK(res.success and res.value[2] == "tail")

	res = run({ "5" }, { argument.num_args(number_arg("one"), 1) })

	CASE("num_args 1 yields an array")
	CHECK(res.success and typeof(res.value[1]) == "table" and res.value[1][1] == 5)

	res = run({ "5" }, { number_arg("plain") })

	CASE("a plain argument yields a scalar")
	CHECK(res.success and res.value[1] == 5)
end)

TEST("wrappers", function()
	local shared = number_arg("shared")
	local listed = argument.num_args(shared, 2)
	local optioned = argument.optional(shared)

	CASE("num_args does not mutate")
	CHECK(shared.num_args == nil and listed.num_args == 2)

	CASE("optional does not mutate")
	CHECK(shared.optional == false and optioned.optional == true)
end)

TEST("no arguments", function()
	local res = run({}, {})

	CASE("no input succeeds")
	CHECK(res.success)

	res = run({ "extra" }, {})

	CASE("input is rejected")
	CHECK(not res.success)

	CASE("error message")
	CHECK(not res.success and res.error == "Expected no arguments, got 1")
end)

local function ranges_of(args: { any }, count: number): string
	local ranges, next_index = argument.assign(args, count)
	local parts = {}
	for _, range in ranges do
		table.insert(parts, if range.last < range.first then "-" else `{range.first}-{range.last}`)
	end
	return `{table.concat(parts, " ")} next={next_index}`
end

TEST("assign", function()
	CASE("each argument takes one value by default")
	CHECK(ranges_of({ string_arg("a"), string_arg("b") }, 2) == "1-1 2-2 next=3")

	CASE("fixed counts take that many values")
	CHECK(ranges_of({ argument.num_args(number_arg("pos"), 3), string_arg("name") }, 4) == "1-3 4-4 next=5")

	CASE("rest takes everything left")
	CHECK(ranges_of({ string_arg("a"), argument.rest(string_arg("tags")) }, 4) == "1-1 2-4 next=5")

	CASE("arguments past the input get empty ranges")
	CHECK(ranges_of({ string_arg("a"), string_arg("b"), argument.rest(string_arg("c")) }, 1) == "1-1 - - next=2")

	CASE("a fixed count is cut short when input runs out")
	CHECK(ranges_of({ argument.num_args(number_arg("pos"), 3) }, 2) == "1-2 next=3")

	CASE("leftover input is after next")
	CHECK(ranges_of({ string_arg("a") }, 3) == "1-1 next=2")

	CASE("no arguments take nothing")
	CHECK(ranges_of({}, 2) == " next=1")
end)

TEST("transform_value", function()
	CASE("transforms a single value")
	local res = argument.transform_value(player, number_arg("n"), "42")
	CHECK(res.success and res.value == 42)

	CASE("reports the type's error")
	res = argument.transform_value(player, number_arg("n"), "abc")
	CHECK(not res.success and res.error == "'abc' is not a number")

	CASE("strips quotes")
	res = argument.transform_value(player, string_arg("s"), '"hi there"')
	CHECK(res.success and res.value == "hi there")

	CASE("list types are split by commas")
	local list_arg = argument.register_list_type("test-list", {
		transform = function(items)
			return result.success(#items)
		end,
	})
	res = argument.transform_value(player, list_arg("items"), "a,b,c")
	CHECK(res.success and res.value == 3)

	CASE("an unregistered type errors")
	CHECK(not pcall(argument.transform_value, player, { name = "x", type = "nonexistent" } :: any, "a"))
end)

return nil
