local fakes = require("./fakes")

local centurion = require("../../pkgs/centurion/src")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local hale = fakes.add_player("Hale")
local tamsin = fakes.add_player("Tamsin", "Hale_Fan")
local offline_id = fakes.add_user("Absent")
local renamed_id = fakes.add_user("NewName", { "OldName" })

local user_arg: centurion.Argument = centurion.args.user("target") :: any

local function find(text: string): centurion.UserInfo?
	local res = centurion.transform_arg(hale, user_arg, text)
	return if res.success then res.value :: centurion.UserInfo else nil
end

local function find_error(text: string): string?
	local res = centurion.transform_arg(hale, user_arg, text)
	return if res.success then nil else res.error
end

-- the result, and how many web lookups it took
local function counted<T>(callback: () -> T): (T, number)
	local before = fakes.lookup_count()
	local value = callback()
	return value, fakes.lookup_count() - before
end

TEST("user", function()
	CASE("an online player is found by exact username, without a lookup")
	local found, lookups = counted(function()
		return find("tamsin")
	end)
	CHECK(found and found.id == tamsin.UserId and found.name == "Tamsin" and found.player == tamsin)
	CHECK(lookups == 0)

	CASE("display names aren't matched")
	CHECK(find_error("hale_fan") == "User 'hale_fan' not found.")

	CASE("@me is the executor")
	found = find("@me")
	CHECK(found and found.player == hale)

	CASE("an offline user is looked up")
	found, lookups = counted(function()
		return find("absent")
	end)
	CHECK(found and found.id == offline_id and found.name == "Absent" and found.player == nil)
	CHECK(lookups == 2)

	CASE("a previous username finds the current one")
	found = find("oldname")
	CHECK(found and found.id == renamed_id and found.name == "NewName")

	CASE("a #id is found online without a lookup, or looked up")
	found, lookups = counted(function()
		return find(`#{tamsin.UserId}`)
	end)
	CHECK(found and found.player == tamsin and lookups == 0)
	found = find(`#{offline_id}`)
	CHECK(found and found.name == "Absent" and found.player == nil)

	CASE("unknown users are reported")
	CHECK(find_error("Nobody") == "User 'Nobody' not found.")
	CHECK(find_error("#99999") == "User #99999 not found.")

	CASE("text that can't be a username or #id isn't looked up")
	local err
	err, lookups = counted(function()
		return find_error("bad!name")
	end)
	CHECK(err == "'bad!name' is not a valid username or #id." and lookups == 0)
	CHECK(find_error("ab") ~= nil and find_error(string.rep("a", 21)) ~= nil)
	CHECK(find_error("#0") ~= nil and find_error("#abc") ~= nil)

	CASE("suggestions are @me and online players")
	local suggestions = (centurion.registry.types.user.suggestions :: any)("", hale, user_arg)
	local texts = {}
	for _, suggestion in suggestions do
		texts[if type(suggestion) == "string" then suggestion else suggestion.text] = true
	end
	CHECK(texts["@me"] and texts["Tamsin"] and not texts["@random"] and not texts["@all"])
end)

TEST("check_args", function()
	CASE("uses a type's check instead of transforming")
	local res, lookups = counted(function()
		return centurion.check_args(hale, { "absent" }, { user_arg })
	end)
	CHECK(res.success and lookups == 0)
	res = centurion.check_args(hale, { "Nobody" }, { user_arg })
	CHECK(res.success)

	CASE("check errors are reported like transform errors")
	res = centurion.check_args(hale, { "bad!name" }, { user_arg })
	CHECK(not res.success and res.error == "Invalid value for 'target': 'bad!name' is not a valid username or #id.")

	CASE("types without a check are transformed")
	local number_arg: centurion.Argument = centurion.args.number("n") :: any
	res = centurion.check_args(hale, { "absent", "5" }, { user_arg, number_arg })
	CHECK(res.success and (res.value :: { unknown })[2] == 5)
	CHECK(not centurion.check_args(hale, { "absent", "x" }, { user_arg, number_arg }).success)

	CASE("argument counts are still checked")
	CHECK(not centurion.check_args(hale, {}, { user_arg }).success)
	CHECK(not centurion.check_args(hale, { "a1", "b2" }, { user_arg }).success)

	CASE("list types get the whole list")
	local seen: { string }? = nil
	local declare = centurion.register_list_type("checked_list", {
		transform = function(texts: { string }): centurion.Result<{ string }>
			return { success = true, value = texts }
		end,
		check = function(texts: { string })
			seen = texts
			return nil
		end,
	})
	local list_arg: centurion.Argument = declare("items") :: any
	CHECK(centurion.check_args(hale, { "a,b" }, { list_arg }).success)
	CHECK(seen and #seen == 2 and seen[1] == "a" and seen[2] == "b")

	CASE("transform_args ignores the check")
	res, lookups = counted(function()
		return centurion.transform_args(hale, { "absent" }, { user_arg })
	end)
	CHECK(res.success and lookups == 2)
end)

return nil
