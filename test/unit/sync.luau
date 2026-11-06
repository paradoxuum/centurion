--!nonstrict
local fakes = require("./fakes")

local centurion = require("../../pkgs/centurion/src")
local services = require("../../pkgs/centurion/src/services")
local sync = require("../../pkgs/centurion/src/sync")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local registry = centurion.registry.commands

local dana = fakes.add_player("Dana")
local evan = fakes.add_player("Evan")

centurion.create_role("sync_staff", { permissions = { "sync_secret" } })
centurion.create_role("sync_viewer")

centurion.register_command("sync_public", {
	description = "Visible to everyone",
	arguments = function()
		return centurion.args.string("text", "Some text")
	end,
	callback = function(_ctx, text: string)
		return text
	end,
})

centurion.register_command("sync_secret", {
	permissions = { "sync_secret" },
	callback = function()
		return "secret"
	end,
})

local function noop() end

local function tick()
	services.RunService.Heartbeat:Fire()
end

local sent = {}

local function sent_to(player)
	local payloads = {}
	for _, entry in sent do
		if entry.player == player then
			table.insert(payloads, entry.payload)
		end
	end
	return payloads
end

-- the single patch sent to a player, or nil if they were sent anything else
local function patch_for(player)
	local payloads = sent_to(player)
	if #payloads ~= 1 or payloads[1].type ~= "patch" then
		return nil
	end
	return payloads[1].data
end

TEST("sync server", function()
	local server = sync.server()
	local disconnect = server.connect(function(player, payload)
		table.insert(sent, { player = player, payload = payload })
	end)

	CASE("nothing is sent before a player is hydrated")
	centurion.register_command("sync_early", { callback = noop })
	tick()
	CHECK(#sent == 0)

	CASE("hydrating sends the commands the player can see")
	server.hydrate(dana)
	local init = sent_to(dana)[1]
	CHECK(#sent == 1 and init.type == "init")
	CHECK(init.data.sync_public ~= nil and init.data.sync_early ~= nil)
	CHECK(init.data.sync_secret == nil)

	CASE("only what the client needs is serialized")
	local public = init.data.sync_public
	CHECK(public.kind == "command" and public.data.description == "Visible to everyone")
	CHECK(public.data.callback == nil and public.data.permissions == nil and public.data.guards == nil)
	CHECK(#public.data.arguments == 1 and public.data.arguments[1].name == "text")

	CASE("registering and unregistering is patched to hydrated players")
	table.clear(sent)
	centurion.register_command("sync_late", { callback = noop })
	centurion.unregister_command("sync_early")
	tick()
	local patch = patch_for(dana)
	CHECK(patch and patch.sync_late.kind == "command" and patch.sync_early.kind == "none")
	CHECK(#sent_to(evan) == 0)

	CASE("a quiet tick sends nothing")
	table.clear(sent)
	tick()
	CHECK(#sent == 0)

	CASE("gaining a role syncs the commands it allows, to that player only")
	server.hydrate(evan)
	table.clear(sent)
	centurion.set_roles(dana, { "sync_staff" })
	tick()
	patch = patch_for(dana)
	CHECK(patch and patch.sync_secret.kind == "command")
	CHECK(#sent_to(evan) == 0)

	CASE("losing the role removes them again")
	table.clear(sent)
	centurion.set_roles(dana, {})
	tick()
	patch = patch_for(dana)
	CHECK(patch and patch.sync_secret.kind == "none")

	CASE("an options change with no effect sends nothing")
	table.clear(sent)
	centurion.set_permission_options({ default_roles = { "sync_viewer" } })
	tick()
	CHECK(#sent == 0)

	CASE("editing a role rechecks everyone")
	centurion.update_role("sync_viewer", { permissions = { "sync_secret" } })
	tick()
	for _, player in { dana, evan } do
		patch = patch_for(player)
		CHECK(patch and patch.sync_secret.kind == "command")
	end

	CASE("changing the default roles rechecks everyone")
	table.clear(sent)
	centurion.set_permission_options({ default_roles = {} })
	tick()
	for _, player in { dana, evan } do
		patch = patch_for(player)
		CHECK(patch and patch.sync_secret.kind == "none")
	end

	CASE("turning hide off syncs restricted commands to everyone")
	table.clear(sent)
	centurion.set_permission_options({ hide = false })
	tick()
	for _, player in { dana, evan } do
		patch = patch_for(player)
		CHECK(patch and patch.sync_secret.kind == "command")
	end
	centurion.set_permission_options({ hide = true })
	tick()

	CASE("players who leave aren't sent anything")
	table.clear(sent)
	fakes.remove_player(evan)
	centurion.register_command("sync_after_leave", { callback = noop })
	tick()
	CHECK(#sent_to(evan) == 0)
	CHECK(patch_for(dana) ~= nil)

	CASE("hydrating a player who left does nothing")
	table.clear(sent)
	server.hydrate(evan)
	CHECK(#sent == 0)

	CASE("disconnecting stops patches")
	disconnect()
	centurion.register_command("sync_after_disconnect", { callback = noop })
	tick()
	CHECK(#sent == 0)

	for _, name in { "sync_late", "sync_after_leave", "sync_after_disconnect" } do
		centurion.unregister_command(name)
	end
end)

local function command_state(description: string?, arguments: { any }?)
	return {
		kind = "command",
		data = {
			description = description,
			arguments = arguments,
		},
	}
end

TEST("sync client", function()
	local warnings = {}
	centurion.set_logger(function(level, message)
		if level == "warn" then
			table.insert(warnings, message)
		end
	end)

	local client = sync.client()

	CASE("patches before the initial state are ignored")
	client.sync({ type = "patch", data = { sync_c_early = command_state("Early") } })
	CHECK(registry.sync_c_early == nil)

	CASE("the initial state registers each command without a callback")
	client.sync({
		type = "init",
		data = {
			sync_c_one = command_state("One", { centurion.args.string("text") }),
			sync_c_two = command_state("Two"),
		},
	})
	local one = registry.sync_c_one
	CHECK(one and one.description == "One" and one.callback == nil)
	CHECK(one and select("#", one.arguments()) == 1 and (one.arguments()).name == "text")
	CHECK(registry.sync_c_two ~= nil)

	CASE("patches add and remove commands")
	client.sync({
		type = "patch",
		data = {
			sync_c_two = { kind = "none" },
			sync_c_three = command_state("Three"),
		},
	})
	CHECK(registry.sync_c_two == nil)
	CHECK(registry.sync_c_three ~= nil)

	CASE("a patched command replaces the synced one")
	client.sync({ type = "patch", data = { sync_c_three = command_state("Three again") } })
	CHECK(registry.sync_c_three.description == "Three again")

	CASE("a new initial state removes commands it doesn't include")
	client.sync({ type = "init", data = { sync_c_three = command_state("Three") } })
	CHECK(registry.sync_c_one == nil)
	CHECK(registry.sync_c_three ~= nil)

	CASE("several payloads are applied in order")
	client.sync(
		{ type = "patch", data = { sync_c_batch = command_state("Batch") } },
		{ type = "patch", data = { sync_c_batch = { kind = "none" } } }
	)
	CHECK(registry.sync_c_batch == nil)

	CASE("a command registered locally isn't replaced or removed")
	centurion.register_command("sync_c_local", { callback = noop })
	table.clear(warnings)
	client.sync({ type = "patch", data = { sync_c_local = command_state("Server") } })
	CHECK(registry.sync_c_local.callback ~= nil)
	CHECK(#warnings == 1)
	client.sync({ type = "patch", data = { sync_c_local = { kind = "none" } } })
	CHECK(registry.sync_c_local ~= nil)

	CASE("a command that fails to register doesn't stop the rest")
	table.clear(warnings)
	client.sync({
		type = "patch",
		data = {
			sync_c_bad = command_state("Bad", { { name = "x", type = "sync_no_such_type", optional = false } }),
			sync_c_good = command_state("Good"),
		},
	})
	CHECK(registry.sync_c_bad == nil)
	CHECK(registry.sync_c_good ~= nil)
	CHECK(#warnings == 1)

	for _, name in { "sync_c_three", "sync_c_local", "sync_c_good" } do
		centurion.unregister_command(name)
	end
	centurion.set_logger(nil)
end)

TEST("execute input validation", function()
	local matches = sync.input_matches

	CASE("input the command and arguments were resolved from matches")
	CHECK(matches("kick", { "Alice" }, "kick Alice"))
	CHECK(matches("kick", { "Alice" }, "  kick   Alice  "))
	CHECK(matches("kick", nil, "kick"))
	CHECK(matches("roles get", { "Alice" }, "roles get Alice"))
	CHECK(matches("roles", { "get", "Alice" }, "roles get Alice"))
	CHECK(matches("say", { '"hello world"' }, 'say "hello world"'))

	CASE("input describing another command doesn't match")
	CHECK(not matches("kick", { "Alice" }, "help"))
	CHECK(not matches("kick", { "Alice" }, "kick Bob"))
	CHECK(not matches("kick", { "Alice" }, "kick Alice extra"))
	CHECK(not matches("kick", { "Alice", "x" }, "kick Alice"))
	CHECK(not matches("kick", nil, '"kick"'))
	CHECK(not matches("say", { "hello world" }, 'say "hello world"'))
	CHECK(not matches("kick", {}, ""))
end)

return nil
