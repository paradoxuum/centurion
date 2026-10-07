local fakes = require("./fakes")

local centurion = require("../../pkgs/centurion/src")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK, FINISH = testkit.TEST, testkit.CASE, testkit.CHECK, testkit.FINISH

local alice = fakes.add_player("Alice")
local bob = fakes.add_player("Bob")
fakes.add_team("Red")

centurion.create_role("member", 1, { "chat" })
centurion.create_role("moderator", 2, { "kick" })
centurion.create_role("admin", 3)

centurion.register_command("echo", {
	arguments = function()
		return centurion.args.string("text")
	end,
	callback = function(_ctx, text: string)
		return text
	end,
})

centurion.register_command("kick", {
	roles = { "moderator" },
	arguments = function()
		return centurion.args.player("target")
	end,
	callback = function(_ctx, target: Player)
		return `kicked {target.Name}`
	end,
})

centurion.register_command("mute", {
	permissions = { "chat" },
	callback = function()
		return "muted"
	end,
})

centurion.register_command("join", {
	arguments = function()
		return centurion.args.team("team")
	end,
	callback = function(_ctx, team: Team)
		return `joined {team.Name}`
	end,
})

local function message(ctx: centurion.Context): string?
	return ctx.response and ctx.response.message
end

TEST("execute", function()
	local ctx = centurion.execute_command(alice, "echo", { "hi" })

	CASE("runs a command with no restrictions")
	CHECK(ctx.response and ctx.response.success and message(ctx) == "hi")

	CASE("resolves player arguments through Players")
	centurion.set_roles(alice, { "moderator" })
	CHECK(message(centurion.execute_command(alice, "kick", { "bob" })) == "kicked Bob")

	CASE("resolves team arguments through Teams")
	CHECK(message(centurion.execute_command(alice, "join", { "Red" })) == "joined Red")
	CHECK(
		message(centurion.execute_command(alice, "join", { "Blue" }))
			== "Invalid value for 'team': Team 'Blue' not found."
	)
end)

TEST("roles", function()
	centurion.set_roles(bob, {})

	CASE("a player without the role can't execute")
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.kick))

	CASE("a higher priority role satisfies a lower one")
	centurion.set_roles(bob, { "admin" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.kick))

	CASE("a lower priority role doesn't")
	centurion.set_roles(bob, { "member" })
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.kick))
end)

TEST("permissions", function()
	CASE("granted directly by a role")
	centurion.set_roles(bob, { "member" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.mute))

	CASE("inherited from a lower priority role")
	centurion.set_roles(bob, { "moderator" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.mute))

	CASE("inheritance doesn't mutate the role")
	CHECK(centurion.registry.roles.moderator.permissions.chat == nil)
end)

TEST("denied execution", function()
	centurion.set_roles(bob, {})

	CASE("is silent while hidden")
	CHECK(centurion.execute_command(bob, "kick", { "Alice" }).response == nil)

	CASE("reports an error when not hidden")
	centurion.set_permission_options({ hide = false })
	local ctx = centurion.execute_command(bob, "kick", { "Alice" })
	CHECK(ctx.response and not ctx.response.success)
	CHECK(message(ctx) == "You do not have permission to execute this command.")
	centurion.set_permission_options({ hide = true })
end)

TEST("player lifecycle", function()
	CASE("default roles apply to existing and joining players")
	centurion.set_permission_options({ default_roles = { "member" } })
	local carol = fakes.add_player("Carol")
	CHECK(table.find(centurion.get_roles(alice), "member") ~= nil)
	CHECK(table.find(centurion.get_roles(carol), "member") ~= nil)
	centurion.set_permission_options({ default_roles = {} })

	CASE("roles are cleared when a player leaves")
	fakes.remove_player(carol)
	CHECK(#centurion.get_roles(carol) == 0)
end)

local ok = FINISH()
if not ok then
	error("Tests failed", 0)
end

return nil
