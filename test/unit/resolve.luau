local resolve = require("../../pkgs/centurion/src/resolve")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local commands = {
	["roles"] = true,
	["roles get"] = true,
	["roles add"] = true,
	["kick"] = true,
} :: any

local function args_of(res)
	return table.concat(res.args, "|")
end

TEST("longest name wins", function()
	local res = resolve(commands, "roles get Bob")

	CASE("resolves the longest registered name")
	CHECK(res.name == "roles get")

	CASE("args exclude the name")
	CHECK(args_of(res) == "Bob")

	CASE("name_end points at the last name token")
	CHECK(res.name_end == 2)
end)

TEST("bare parent", function()
	local res = resolve(commands, "roles")

	CASE("resolves")
	CHECK(res.name == "roles")

	CASE("has no args")
	CHECK(#res.args == 0)
end)

TEST("quoting", function()
	local res = resolve(commands, 'roles "get"')

	CASE("a quoted token doesn't extend the name")
	CHECK(res.name == "roles")

	CASE("a quoted token becomes an argument")
	CHECK(args_of(res) == '"get"')

	res = resolve(commands, "roles 'get' Bob")

	CASE("single quotes work too")
	CHECK(res.name == "roles")

	CASE("args keep their quoting")
	CHECK(args_of(res) == "'get'|Bob")

	res = resolve(commands, 'kick Bob "being rude"')

	CASE("quoted arguments stay quoted")
	CHECK(args_of(res) == 'Bob|"being rude"')
end)

TEST("unresolved input", function()
	local res = resolve(commands, "nonsense here")

	CASE("unknown command resolves to nil")
	CHECK(res.name == nil)

	CASE("name_end is 0")
	CHECK(res.name_end == 0)

	CASE("args are the whole input")
	CHECK(args_of(res) == "nonsense|here")

	res = resolve(commands, "")

	CASE("empty input resolves to nil")
	CHECK(res.name == nil and #res.args == 0 and #res.tokens == 0)
end)

TEST("partial subcommand", function()
	local res = resolve(commands, "roles remove Bob")

	CASE("falls back to the parent")
	CHECK(res.name == "roles")

	CASE("the rest become arguments")
	CHECK(args_of(res) == "remove|Bob")
end)

TEST("unclosed quotes", function()
	CASE("are flagged")
	CHECK(resolve(commands, 'kick "Bob').unclosed_quote)

	CASE("closed input isn't flagged")
	CHECK(not resolve(commands, "kick Bob").unclosed_quote)
end)

return nil
