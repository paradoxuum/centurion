local fakes = require("./fakes")

local centurion = require("../../pkgs/centurion/src")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

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

TEST("global guards", function()
	CASE("block every command until removed")
	local remove = centurion.add_global_guard(function(ctx)
		ctx.error("blocked")
		return false
	end)
	CHECK(message(centurion.execute_command(alice, "echo", { "hi" })) == "blocked")
	remove()
	CHECK(message(centurion.execute_command(alice, "echo", { "hi" })) == "hi")

	CASE("removing twice is a no-op")
	local remove_other = centurion.add_global_guard(function()
		return true
	end)
	remove()
	CHECK(#centurion.registry.global_guards == 1)
	remove_other()
	remove_other()
	CHECK(#centurion.registry.global_guards == 0)

	CASE("a guard removing itself doesn't skip the next one")
	local remove_self
	remove_self = centurion.add_global_guard(function()
		remove_self()
		return true
	end)
	local remove_blocker = centurion.add_global_guard(function(ctx)
		ctx.error("blocked")
		return false
	end)
	CHECK(message(centurion.execute_command(alice, "echo", { "hi" })) == "blocked")
	remove_blocker()
	CHECK(#centurion.registry.global_guards == 0)
end)

TEST("named guards", function()
	CASE("registering a command with an unknown guard errors")
	CHECK(not pcall(centurion.register_command, "guarded", {
		guards = { "missing" },
		callback = function() end,
	}))
	CHECK(centurion.registry.commands.guarded == nil)

	CASE("can be unregistered and registered again")
	centurion.register_guard("deny", function()
		return false
	end)
	centurion.unregister_guard("deny")
	CHECK(centurion.registry.guards.deny == nil)
	centurion.register_guard("deny", function()
		return false
	end)
	CHECK(centurion.registry.guards.deny ~= nil)
	centurion.unregister_guard("deny")

	CASE("unregistering an unknown guard errors")
	CHECK(not pcall(centurion.unregister_guard, "deny"))
end)

TEST("argument types", function()
	CASE("registering a duplicate type errors")
	CHECK(not pcall(centurion.register_type, "string", {
		transform = function(text)
			return centurion.result.ok(text)
		end,
	}))
end)

return nil
