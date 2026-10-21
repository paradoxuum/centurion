local fakes = require("./fakes")

local centurion = require("../../pkgs/centurion/src")
local permission = require("../../pkgs/centurion/src/permission")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local alice = fakes.add_player("Alice")
local bob = fakes.add_player("Bob")
fakes.add_team("Red")

centurion.create_role("member", { permissions = { "chat" } })
centurion.create_role("moderator", { permissions = { "kick" }, inherits = { "member" } })
centurion.create_role("builder", { permissions = { "build" } })
centurion.create_role("admin", { inherits = { "moderator", "builder" } })

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

TEST("command builder", function()
	CASE("registers the command once a callback is given")
	local builder = centurion.command({ "greet", "hello" }, {
		permissions = { "chat" },
		arguments = function()
			return centurion.args.string("name"), centurion.optional(centurion.args.integer("times"))
		end,
	})
	CHECK(centurion.registry.commands.greet == nil)

	builder:callback(function(_ctx, name, times)
		return string.rep(`hi {name} `, times or 1):sub(1, -2)
	end)
	CHECK(centurion.registry.commands.greet ~= nil)
	CHECK(centurion.registry.commands.hello == centurion.registry.commands.greet)

	CASE("passes the definition through")
	local permissions = centurion.registry.commands.greet.permissions
	CHECK(permissions and permissions[1] == "chat")

	CASE("executes with transformed arguments")
	centurion.set_roles(alice, { "member" })
	CHECK(message(centurion.execute_command(alice, "greet", { "Bob", "2" })) == "hi Bob hi Bob")
	CHECK(message(centurion.execute_command(alice, "hello", { "Bob" })) == "hi Bob")

	CASE("works without arguments")
	centurion.command("ping", {}):callback(function()
		return "pong"
	end)
	CHECK(message(centurion.execute_command(alice, "ping", {})) == "pong")
end)

TEST("roles", function()
	centurion.set_roles(bob, {})

	CASE("a player without the role can't execute")
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.kick))

	CASE("having the role satisfies it")
	centurion.set_roles(bob, { "moderator" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.kick))

	CASE("a role that inherits it, even indirectly, satisfies it")
	centurion.set_roles(bob, { "admin" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.kick))

	CASE("a role it inherits from doesn't")
	centurion.set_roles(bob, { "member" })
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.kick))

	CASE("an unrelated role doesn't")
	centurion.set_roles(bob, { "builder" })
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.kick))
end)

TEST("permissions", function()
	CASE("granted directly by a role")
	centurion.set_roles(bob, { "member" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.mute))

	CASE("inherited from a parent role")
	centurion.set_roles(bob, { "moderator" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.mute))

	CASE("inherited through several levels")
	centurion.set_roles(bob, { "admin" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.mute))

	CASE("not granted by an unrelated role")
	centurion.set_roles(bob, { "builder" })
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.mute))

	CASE("inheritance doesn't mutate the role")
	CHECK(centurion.registry.roles.moderator.permissions.chat == nil)
end)

TEST("role registration", function()
	CASE("registering a duplicate role errors")
	CHECK(not pcall(centurion.create_role, "member", { permissions = { "fly" } }))
	CHECK(centurion.registry.roles.member.permissions.fly == nil)

	CASE("inheriting from an unknown role errors")
	CHECK(not pcall(centurion.create_role, "helper", { inherits = { "moderater" } }))
	CHECK(centurion.registry.roles.helper == nil)

	CASE("the options table can't change the role afterwards")
	local options = { inherits = { "member" } }
	centurion.create_role("guest", options)
	table.insert(options.inherits, "admin")
	CHECK(#centurion.registry.roles.guest.inherits == 1)

	CASE("registering a command with an unknown role errors")
	CHECK(not pcall(centurion.register_command, "typo", {
		roles = { "moderater" },
		callback = function() end,
	}))
	CHECK(centurion.registry.commands.typo == nil)

	CASE("registering a restricted command on the client errors")
	fakes.set_server(false)
	CHECK(not pcall(centurion.register_command, "client_roles", {
		roles = { "moderator" },
		callback = function() end,
	}))
	CHECK(not pcall(centurion.register_command, "client_permissions", {
		permissions = { "chat" },
		callback = function() end,
	}))

	CASE("unrestricted commands still register on the client")
	centurion.register_command("client_only", {
		callback = function() end,
	})
	CHECK(centurion.registry.commands.client_only ~= nil)
	centurion.unregister_command("client_only")
	fakes.set_server(true)
end)

TEST("role lists", function()
	CASE("mutating the list passed to set_roles doesn't change roles")
	local list = { "member" }
	centurion.set_roles(bob, list)
	table.insert(list, "admin")
	CHECK(#centurion.get_roles(bob) == 1)

	CASE("mutating the list from get_roles doesn't change roles")
	table.insert(centurion.get_roles(bob), "admin")
	CHECK(#centurion.get_roles(bob) == 1)

	CASE("mutating the list given to listeners doesn't change roles")
	local disconnect = centurion.events.on_roles_changed(bob, function(roles)
		table.insert(roles, "admin")
	end)
	centurion.set_roles(bob, { "member" })
	disconnect()
	CHECK(#centurion.get_roles(bob) == 1)
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

TEST("deny unrestricted", function()
	centurion.set_roles(bob, { "admin" })
	centurion.set_permission_options({ deny_unrestricted = true })

	CASE("unrestricted commands can't be executed")
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.echo))
	CHECK(centurion.execute_command(bob, "echo", { "hi" }).response == nil)

	CASE("restricted commands are unaffected")
	CHECK(centurion.can_execute(bob, centurion.registry.commands.kick))

	CASE("unrestricted commands can be executed again when disabled")
	centurion.set_permission_options({ deny_unrestricted = false })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.echo))

	centurion.set_roles(bob, {})
end)

TEST("has_permission", function()
	CASE("granted directly")
	centurion.set_roles(bob, { "builder" })
	CHECK(centurion.has_permission(bob, "build"))

	CASE("inherited")
	centurion.set_roles(bob, { "admin" })
	CHECK(centurion.has_permission(bob, "chat"))

	CASE("not granted")
	centurion.set_roles(bob, { "member" })
	CHECK(not centurion.has_permission(bob, "kick"))
	CHECK(not centurion.has_permission(bob, "nonexistent"))
end)

TEST("default roles", function()
	centurion.set_roles(bob, {})
	centurion.set_permission_options({ default_roles = { "member" } })
	local carol = fakes.add_player("Carol")

	CASE("apply to existing and joining players")
	CHECK(centurion.has_permission(bob, "chat"))
	CHECK(centurion.has_permission(carol, "chat"))
	CHECK(centurion.can_execute(carol, centurion.registry.commands.mute))

	CASE("aren't included in get_roles")
	CHECK(#centurion.get_roles(carol) == 0)

	CASE("aren't removed by set_roles")
	centurion.set_roles(carol, { "builder" })
	CHECK(centurion.has_permission(carol, "chat"))
	CHECK(centurion.has_permission(carol, "build"))

	CASE("stop applying when cleared")
	centurion.set_permission_options({ default_roles = {} })
	CHECK(not centurion.has_permission(carol, "chat"))

	CASE("an unknown default role errors")
	CHECK(not pcall(centurion.set_permission_options, { default_roles = { "moderater" } }))
	CHECK(not centurion.has_permission(carol, "chat"))

	fakes.remove_player(carol)
end)

TEST("deleting roles", function()
	centurion.create_role("trial", { permissions = { "fly" } })
	centurion.create_role("trial_plus", { inherits = { "trial" } })
	centurion.register_command("fly", {
		roles = { "trial_plus" },
		callback = function()
			return "flying"
		end,
	})

	CASE("deleting an unknown role errors")
	CHECK(not pcall(centurion.delete_role, "nonexistent"))

	CASE("deleting an inherited role errors")
	CHECK(not pcall(centurion.delete_role, "trial"))
	CHECK(centurion.registry.roles.trial ~= nil)

	CASE("deleting a default role errors")
	centurion.set_permission_options({ default_roles = { "trial" } })
	centurion.delete_role("trial_plus")
	CHECK(not pcall(centurion.delete_role, "trial"))
	CHECK(centurion.registry.roles.trial ~= nil)
	centurion.set_permission_options({ default_roles = {} })

	CASE("players lose the role and listeners are notified")
	centurion.set_roles(bob, { "member", "trial" })
	local notified: { string }? = nil
	local disconnect = centurion.events.on_roles_changed(bob, function(roles)
		notified = roles
	end)
	centurion.delete_role("trial")
	disconnect()
	CHECK(#centurion.get_roles(bob) == 1 and centurion.get_roles(bob)[1] == "member")
	CHECK(notified ~= nil and #notified == 1)
	CHECK(not centurion.has_permission(bob, "fly"))

	CASE("a command requiring a deleted role can't be run by anyone")
	centurion.set_roles(bob, { "admin" })
	CHECK(not centurion.can_execute(bob, centurion.registry.commands.fly))

	CASE("registering a command with a deleted role errors")
	CHECK(not pcall(centurion.register_command, "glide", {
		roles = { "trial" },
		callback = function() end,
	}))

	CASE("a deleted role can be created again")
	centurion.create_role("trial_plus")
	CHECK(centurion.registry.roles.trial_plus ~= nil)
	centurion.set_roles(bob, { "trial_plus" })
	CHECK(centurion.can_execute(bob, centurion.registry.commands.fly))

	centurion.set_roles(bob, {})
	centurion.delete_role("trial_plus")
	centurion.unregister_command("fly")
end)

TEST("player lifecycle", function()
	local dave = fakes.add_player("Dave")
	centurion.set_roles(dave, { "member" })

	CASE("roles are cleared when a player leaves")
	fakes.remove_player(dave)
	CHECK(#centurion.get_roles(dave) == 0)

	CASE("setting roles after a player leaves is ignored")
	centurion.set_roles(dave, { "admin" })
	CHECK(#centurion.get_roles(dave) == 0)
	centurion.add_roles(dave, "admin")
	CHECK(#centurion.get_roles(dave) == 0)
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

TEST("guard responses", function()
	local remove

	CASE("a guard's own error is kept")
	remove = centurion.add_global_guard(function(ctx)
		ctx.error("blocked")
		return false
	end)
	CHECK(message(centurion.execute_command(alice, "echo", { "hi" })) == "blocked")
	remove()

	CASE("a guard's own reply is kept")
	remove = centurion.add_global_guard(function(ctx)
		ctx.reply("not now")
		return false
	end)
	local ctx = centurion.execute_command(alice, "echo", { "hi" })
	CHECK(message(ctx) == "not now")
	CHECK(ctx.response.success)
	remove()

	CASE("denying without a response gives a default error")
	remove = centurion.add_global_guard(function()
		return false
	end)
	ctx = centurion.execute_command(alice, "echo", { "hi" })
	CHECK(message(ctx) == "You cannot execute this command.")
	CHECK(not ctx.response.success)
	remove()

	CASE("a named guard gets the default error too")
	centurion.register_guard("deny", function()
		return false
	end)
	centurion.register_command("denied", {
		guards = { "deny" },
		callback = function()
			return "ran"
		end,
	})
	CHECK(message(centurion.execute_command(alice, "denied")) == "You cannot execute this command.")
	centurion.unregister_command("denied")
	centurion.unregister_guard("deny")
end)

TEST("argument types", function()
	CASE("registering a duplicate type errors")
	CHECK(not pcall(centurion.register_type, "string", {
		transform = function(text)
			return centurion.result.ok(text)
		end,
	}))
end)

TEST("register events", function()
	local registered: { string } = {}
	local unregistered: { string } = {}
	local stop_register = centurion.events.on_command_register(function(name)
		table.insert(registered, name)
	end)
	local stop_unregister = centurion.events.on_command_unregister(function(name)
		table.insert(unregistered, name)
	end)

	centurion.register_command({ "teleport", "tp" }, {
		callback = function() end,
	})

	CASE("register fires once per alias")
	CHECK(table.concat(registered, ",") == "teleport,tp")

	centurion.unregister_command("tp")

	CASE("unregister fires for every name removed")
	table.sort(unregistered)
	CHECK(table.concat(unregistered, ",") == "teleport,tp")

	CASE("all aliases are removed")
	CHECK(centurion.registry.commands["teleport"] == nil)

	stop_register()
	stop_unregister()
end)

TEST("updating roles", function()
	centurion.create_role("helper", { permissions = { "warn" } })
	centurion.create_role("senior_helper", { inherits = { "helper" } })
	centurion.create_role("head_helper", { inherits = { "senior_helper" } })
	centurion.set_roles(bob, { "head_helper" })

	CASE("updating an unknown role errors")
	CHECK(not pcall(centurion.update_role, "nonexistent", {}))

	CASE("new permissions reach roles that inherit transitively")
	centurion.update_role("helper", { permissions = { "warn", "mute_chat" } })
	CHECK(centurion.has_permission(bob, "mute_chat"))

	CASE("replaced permissions are taken away")
	centurion.update_role("helper", { permissions = { "mute_chat" } })
	CHECK(not centurion.has_permission(bob, "warn"))

	CASE("omitted fields are kept")
	centurion.update_role("senior_helper", { permissions = { "slow" } })
	CHECK(centurion.has_permission(bob, "slow") and centurion.has_permission(bob, "mute_chat"))

	CASE("inheritance can be changed")
	centurion.update_role("senior_helper", { inherits = { "builder" } })
	CHECK(centurion.has_permission(bob, "build") and not centurion.has_permission(bob, "mute_chat"))
	CHECK(centurion.has_permission(bob, "slow"))

	CASE("an inheritance cycle is rejected")
	CHECK(not pcall(centurion.update_role, "senior_helper", { inherits = { "head_helper" } }))
	CHECK(not pcall(centurion.update_role, "senior_helper", { inherits = { "senior_helper" } }))
	CHECK(centurion.has_permission(bob, "build"))

	CASE("an unknown inherited role is rejected")
	CHECK(not pcall(centurion.update_role, "senior_helper", { inherits = { "nonexistent" } }))

	CASE("listeners are notified")
	local updated: string? = nil
	local disconnect = permission.on_role_updated(function(name)
		updated = name
	end)
	centurion.update_role("helper", { permissions = {} })
	disconnect()
	CHECK(updated == "helper")

	centurion.set_roles(bob, {})
	centurion.delete_role("head_helper")
	centurion.delete_role("senior_helper")
	centurion.delete_role("helper")
end)

return nil
