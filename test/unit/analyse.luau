local fakes = require("./fakes")

local analyse = require("../../pkgs/centurion-ui/src/analyse")
local centurion = require("../../pkgs/centurion/src")
local testkit = require("./testkit").test()
local types = require("../../pkgs/centurion-ui/src/types")

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local wren = fakes.add_player("Wren")
fakes.add_player("Orrin", "Juniper")

local colour = centurion.register_type("ui_colour", {
	transform = function(text: string): centurion.Result<string>
		return { success = true, value = text }
	end,
	suggestions = function()
		return { { text = "red", description = "From the type" }, "blue" }
	end,
})

local commands: { [string]: { description: string?, arguments: (() -> ...any)? } } = {
	ui_give = {
		description = "Gives an item",
		arguments = function()
			return centurion.args.player("target"),
				centurion.args.string("item", nil, { "sword", { text = "health potion", description = "Heals" } })
		end,
	},
	ui_bring = {
		arguments = function()
			return centurion.args.players("targets")
		end,
	},
	ui_ban = {
		arguments = function()
			return centurion.args.player("target", nil, nil, { random = false })
		end,
	},
	ui_paint = {
		arguments = function()
			return colour("colour", nil, { "green", "red" })
		end,
	},
	ui_role = {
		arguments = function()
			return centurion.args.string("action", nil, { "list" })
		end,
	},
	["ui_role add"] = {},
}

for name, data in commands do
	centurion.register_command(name, {
		description = data.description,
		arguments = data.arguments,
		callback = function() end,
	})
end

-- `|` marks the cursor, which is at the end if it's left out
local function run(text: string, max_suggestions: number?): types.AnalysisResult
	local pos = text:find("|", 1, true)
	if pos then
		text = text:gsub("|", "", 1)
	end
	return analyse(wren, text, pos or #text + 1, max_suggestions)
end

local function names(res: types.AnalysisResult): string
	local list = {}
	for _, suggestion in res.suggestions do
		table.insert(list, suggestion.name)
	end
	return table.concat(list, ",")
end

local function find(res: types.AnalysisResult, name: string): types.AnalysisSuggestion?
	for _, suggestion in res.suggestions do
		if suggestion.name == name then
			return suggestion
		end
	end
	return nil
end

local function error_of(res: types.AnalysisResult): string?
	return if res.result.success then nil else res.result.error
end

TEST("analyse commands", function()
	CASE("empty input has nothing to suggest")
	local res = run("")
	CHECK(res.result.success and #res.suggestions == 0)

	CASE("an unknown command is an error, and close commands are suggested")
	res = run("ui_giv")
	CHECK(res.command == nil and error_of(res) == "Unknown command")
	CHECK(res.suggestions[1].name == "ui_give" and res.suggestions[1].kind == "command")
	CHECK(res.suggestions[1].description == "Gives an item")
	CHECK(res.suggestions[1].span == vector.create(1, 6, 0) and res.suggestions[1].replace == "ui_give")

	CASE("a resolved command comes first")
	res = run("ui_role")
	CHECK(res.command == "ui_role" and res.suggestions[1].name == "ui_role")
	CHECK(find(res, "ui_role add") ~= nil)

	CASE("subcommands are offered alongside the first argument")
	res = run("ui_role ")
	CHECK(names(res) == "ui_role add,list")
	CHECK(res.suggestions[1].kind == "command" and res.suggestions[2].kind == "argument")

	CASE("the limit applies to the merged list")
	res = run("ui_role ", 1)
	CHECK(names(res) == "ui_role add" and res.hidden_suggestions == 1)
end)

TEST("analyse arguments", function()
	CASE("the argument under the cursor is reported")
	local res = run("ui_give wren ")
	CHECK(res.argument and res.argument.index == 2 and res.argument.type == "string")
	CHECK(res.argument and res.argument.kind == "single")
	res = run("ui_give w|ren sword")
	CHECK(res.argument and res.argument.index == 1 and res.argument.type == "player")

	CASE("a suggestion is inserted at the cursor when it's between tokens")
	res = run("ui_give ")
	CHECK(res.suggestions[1].name == "@me" and res.suggestions[1].span == vector.create(9, 8, 0))

	CASE("a suggestion replaces the token under the cursor")
	res = run("ui_give wr")
	CHECK(res.suggestions[1].name == "Wren" and res.suggestions[1].replace == "Wren")
	CHECK(res.suggestions[1].span == vector.create(9, 10, 0))
	CHECK(#res.suggestions[1].matches == 1 and res.suggestions[1].matches[1] == vector.create(1, 2, 0))

	CASE("players can be found by display name, which inserts their username")
	res = run("ui_give jun")
	local suggestion = res.suggestions[1]
	CHECK(suggestion.name == "Orrin" and suggestion.replace == "Orrin" and suggestion.description == "Juniper")

	CASE("suggestions with spaces are quoted")
	res = run("ui_give wren health")
	CHECK(res.suggestions[1].name == "health potion" and res.suggestions[1].replace == '"health potion"')
	CHECK(res.suggestions[1].description == "Heals")

	CASE("string suggestions have no description")
	suggestion = find(run("ui_give wren "), "sword") :: types.AnalysisSuggestion
	CHECK(suggestion and suggestion.description == nil)

	CASE("type suggestions come first, and the first with a text wins")
	res = run("ui_paint ")
	CHECK(names(res) == "red,blue,green")
	CHECK(res.suggestions[1].description == "From the type")

	CASE("the argument's options reach its type's suggestions")
	CHECK(find(run("ui_give "), "@random") ~= nil)
	CHECK(find(run("ui_ban "), "@random") == nil and find(run("ui_ban "), "@me") ~= nil)

	CASE("the limit hides the rest")
	res = run("ui_give ", 2)
	CHECK(#res.suggestions == 2 and res.hidden_suggestions == #run("ui_give ").suggestions - 2)

	CASE("nothing is suggested past the last argument")
	res = run("ui_give wren sword ")
	CHECK(#res.suggestions == 0 and res.argument == nil)
end)

TEST("analyse list arguments", function()
	CASE("only the entry under the cursor is replaced")
	local res = run("ui_bring wren,or")
	CHECK(res.argument and res.argument.kind == "list")
	CHECK(res.suggestions[1].name == "Orrin" and res.suggestions[1].span == vector.create(15, 16, 0))

	res = run("ui_bring w|ren,or")
	CHECK(res.suggestions[1].name == "Wren" and res.suggestions[1].span == vector.create(10, 13, 0))

	CASE("a trailing comma starts a new entry")
	res = run("ui_bring wren,")
	CHECK(res.suggestions[1].name == "@me" and res.suggestions[1].span.x == 15)
	CHECK(find(res, "@all") ~= nil)
end)

TEST("analyse results", function()
	CASE("arguments are transformed as the executor")
	local res = run("ui_give @me sword")
	CHECK(res.result.success and (res.result.value :: { unknown })[1] == wren)

	CASE("transform errors are reported")
	res = run("ui_give wre sword")
	CHECK(error_of(res) == "Invalid value for 'target': Player 'wre' not found. Did you mean Wren?")
	CHECK(error_of(run("ui_give")) == "Missing required argument: target")

	CASE("an unclosed quote is reported")
	CHECK(error_of(run('ui_give wren "health')) == "Unclosed quote at position 14")
end)

return nil
