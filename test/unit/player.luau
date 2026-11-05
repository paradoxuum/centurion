local fakes = require("./fakes")

local centurion = require("../../pkgs/centurion/src")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local mira = fakes.add_player("Mira")
local miranda = fakes.add_player("Miranda")
local thief = fakes.add_player("Thief99", "Mira")
local kestrel = fakes.add_player("Kestrel")
local zed = fakes.add_player("Zed", "Kenji")
local noob = fakes.add_player("xX_Noob_Xx", "Sam")
local samwise = fakes.add_player("Samwise")
local quill1 = fakes.add_player("Quill1", "Nova")
local quill2 = fakes.add_player("Quill2", "Nova")

-- declarators are typed as the value they produce, so cast them back
local player_arg: centurion.Argument = centurion.args.player("target") :: any
local players_arg: centurion.Argument = centurion.args.players("targets") :: any
local fuzzy_player_arg: centurion.Argument = centurion.args.fuzzy_player("target") :: any
local fuzzy_players_arg: centurion.Argument = centurion.args.fuzzy_players("targets") :: any

local function find(text: string, arg: centurion.Argument?): Player?
	local res = centurion.transform_arg(mira, arg or fuzzy_player_arg, text)
	return if res.success then res.value :: Player else nil
end

local function find_error(text: string, arg: centurion.Argument?): string?
	local res = centurion.transform_arg(mira, arg or fuzzy_player_arg, text)
	return if res.success then nil else res.error
end

local function find_all(text: string, arg: centurion.Argument?): { Player }?
	local res = centurion.transform_arg(mira, arg or fuzzy_players_arg, text)
	if not res.success then
		return nil
	end

	local found = table.clone(res.value :: { Player })
	table.sort(found, function(a: Player, b: Player)
		return a.Name < b.Name
	end)
	return found
end

TEST("fuzzy player matching", function()
	CASE("an exact username matches, ignoring case")
	CHECK(find("Kestrel") == kestrel)
	CHECK(find("kESTREL") == kestrel)

	CASE("an exact display name matches")
	CHECK(find("kenji") == zed)

	CASE("a username prefix matches")
	CHECK(find("kes") == kestrel)

	CASE("a display name prefix matches")
	CHECK(find("ken") == zed)

	CASE("an exact username wins over a longer username sharing its prefix")
	CHECK(find("mira") == mira)
	CHECK(find("miranda") == miranda)

	CASE("a display name copying a username can't take its place")
	CHECK(find("Mira") == mira)
	CHECK(thief ~= mira)

	CASE("an exact display name wins over a username prefix")
	CHECK(find("sam") == noob)
	CHECK(find("samw") == samwise)

	CASE("a username prefix wins over a display name prefix")
	CHECK(find("ke") == kestrel)

	CASE("several matches in the same tier are an error naming them")
	CHECK(find_error("nova") == "'nova' matches more than one player: Quill1, Quill2.")
	CHECK(find_error("mir") == "'mir' matches more than one player: Mira, Miranda.")
	CHECK(find("qu") == nil)
	CHECK(find("quill2") == quill2)

	CASE("a long list of matches is summarised")
	local pips = {}
	for i = 1, 7 do
		table.insert(pips, fakes.add_player(`Pip{i}`))
	end
	CHECK(find_error("pip") == "'pip' matches more than one player: Pip1, Pip2, Pip3, Pip4, Pip5 and 2 more.")
	for _, pip in pips do
		fakes.remove_player(pip)
	end

	CASE("blank input matches nobody")
	CHECK(find_error("") == "Player '' not found.")
	CHECK(find("   ") == nil)

	CASE("unknown names are reported")
	CHECK(find_error("nobody") == "Player 'nobody' not found.")

	CASE("special values still work")
	CHECK(find("@me") == mira and find(".") == mira)
	CHECK(find("@random") ~= nil and find("?") ~= nil)
end)

TEST("fuzzy players matching", function()
	CASE("each entry is matched like a single player")
	local found = find_all("kes,kenji,sam")
	CHECK(found and #found == 3 and found[1] == kestrel and found[2] == zed and found[3] == noob)

	CASE("duplicates are only included once")
	found = find_all("zed,kenji")
	CHECK(found and #found == 1 and found[1] == zed)

	CASE("an ambiguous entry fails the whole list")
	local res = centurion.transform_arg(mira, fuzzy_players_arg, "kes,nova")
	CHECK(not res.success and res.error == "'nova' matches more than one player: Quill1, Quill2.")

	CASE("@others excludes the executor")
	found = find_all("@others")
	CHECK(found and table.find(found, mira) == nil and table.find(found, quill1) ~= nil)
end)

TEST("strict player matching", function()
	CASE("an exact username matches, ignoring case")
	CHECK(find("Kestrel", player_arg) == kestrel)
	CHECK(find("kESTREL", player_arg) == kestrel)
	CHECK(find("mira", player_arg) == mira)

	CASE("display names and prefixes don't match, but suggest the username")
	CHECK(find_error("kenji", player_arg) == "Player 'kenji' not found. Did you mean Zed?")
	CHECK(find_error("kes", player_arg) == "Player 'kes' not found. Did you mean Kestrel?")

	CASE("no username is suggested when several players are close")
	CHECK(find_error("nova", player_arg) == "Player 'nova' not found.")
	CHECK(find_error("mir", player_arg) == "Player 'mir' not found.")
	CHECK(find_error("nobody", player_arg) == "Player 'nobody' not found.")

	CASE("a target who left can't be replaced by someone with a similar name")
	local spammer = fakes.add_player("Spammer")
	local fan = fakes.add_player("SpammerFan", "Spammer2")
	local copycat = fakes.add_player("Copycat", "Spammer")
	CHECK(find("spammer", player_arg) == spammer)
	fakes.remove_player(spammer)
	CHECK(find("spammer", player_arg) == nil)
	CHECK(find("spammer") == copycat)
	-- the hint names who would match, but the command still doesn't run
	CHECK(find_error("spammer", player_arg) == "Player 'spammer' not found. Did you mean Copycat?")
	fakes.remove_player(fan)
	fakes.remove_player(copycat)

	CASE("special values still work")
	CHECK(find("@me", player_arg) == mira)
	CHECK(find("@random", player_arg) ~= nil)

	CASE("each list entry must be an exact username")
	local found = find_all("kestrel,zed", players_arg)
	CHECK(found and #found == 2 and found[1] == kestrel and found[2] == zed)
	CHECK(find_all("kestrel,kenji", players_arg) == nil)
	found = find_all("@others", players_arg)
	CHECK(found and table.find(found, mira) == nil)
end)

local function suggestion_for(list: centurion.SuggestionList, text: string): centurion.Suggestion?
	for _, suggestion in list do
		local suggestion_text = if type(suggestion) == "string" then suggestion else suggestion.text
		if suggestion_text == text then
			return suggestion
		end
	end
	return nil
end

local function suggestions_for(arg: centurion.Argument): centurion.SuggestionList
	return (centurion.registry.types[arg.type].suggestions :: any)("", mira, arg)
end

TEST("player suggestions", function()
	local suggestions = suggestions_for(player_arg)

	CASE("a player without a display name is a plain username")
	CHECK(suggestion_for(suggestions, "Kestrel") == "Kestrel")

	CASE("a player with a display name inserts their username but can be found by either")
	local suggestion = suggestion_for(suggestions, "Zed") :: any
	CHECK(type(suggestion) == "table")
	CHECK(suggestion and suggestion.description == "Kenji")
	CHECK(suggestion and #suggestion.aliases == 1 and suggestion.aliases[1] == "Kenji")

	CASE("special values are described")
	local me = suggestion_for(suggestions, "@me") :: any
	CHECK(me and me.description == "Yourself")
	CHECK(suggestion_for(suggestions, "@all") == nil)

	CASE("fuzzy types suggest the same")
	CHECK(#suggestions_for(fuzzy_player_arg) == #suggestions)

	CASE("the list type also suggests @all and @others")
	local list_suggestions = suggestions_for(players_arg)
	CHECK(suggestion_for(list_suggestions, "@all") ~= nil)
	CHECK(suggestion_for(list_suggestions, "@others") ~= nil)
end)

TEST("player options", function()
	local no_random: centurion.Argument = centurion.args.player("target", nil, nil, { random = false }) :: any
	local no_all: centurion.Argument = centurion.args.players("targets", nil, nil, { all = false }) :: any
	local list_no_random: centurion.Argument =
		centurion.args.fuzzy_players("targets", nil, nil, { random = false }) :: any

	CASE("random can be turned off")
	CHECK(find_error("@random", no_random) == "'@random' can't be used here.")
	CHECK(find_error("?", no_random) == "'?' can't be used here.")
	CHECK(find("@me", no_random) == mira and find("kestrel", no_random) == kestrel)
	CHECK(find_all("@random", list_no_random) == nil)

	CASE("@all and @others can be turned off")
	local res = centurion.transform_arg(mira, no_all, "kestrel,@all")
	CHECK(not res.success and res.error == "'@all' can't be used here.")
	CHECK(find_all("@others", no_all) == nil)
	local found = find_all("kestrel,zed", no_all)
	CHECK(found and #found == 2)

	CASE("turned off values aren't suggested")
	CHECK(suggestion_for(suggestions_for(no_random), "@random") == nil)
	CHECK(suggestion_for(suggestions_for(no_random), "@me") ~= nil)
	local list = suggestions_for(no_all)
	CHECK(suggestion_for(list, "@all") == nil and suggestion_for(list, "@others") == nil)
	CHECK(suggestion_for(list, "@random") ~= nil)

	CASE("options are kept by wrappers")
	local wrapped: centurion.Argument =
		centurion.optional(centurion.args.player("target", nil, nil, { random = false })) :: any
	CHECK(find_error("@random", wrapped) == "'@random' can't be used here.")
end)

TEST("transform receives the argument", function()
	local seen: centurion.Argument? = nil
	local declare = centurion.register_type("seen_arg", {
		transform = function(text: string, _executor: Player, arg: centurion.Argument<{ prefix: string }>)
			seen = arg
			local prefix = if arg.options then arg.options.prefix else ""
			return { success = true, value = prefix .. text } :: centurion.Result<string>
		end,
	})

	local arg: centurion.Argument = declare("thing", "A thing", nil, { prefix = ">" }) :: any
	local res = centurion.transform_arg(mira, arg, "x")

	CASE("with its name and options")
	CHECK(res.success and res.value == ">x")
	CHECK(seen and seen.name == "thing" and seen.description == "A thing")

	CASE("options are optional")
	res = centurion.transform_arg(mira, declare("thing") :: any, "x")
	CHECK(res.success and res.value == "x")
end)

return nil
