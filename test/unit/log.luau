local fakes = require("./fakes")

local centurion = require("../../pkgs/centurion/src")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

local carol = fakes.add_player("Carol")

type Entry = {
	level: centurion.LogLevel,
	message: string,
	info: centurion.LogInfo,
}

local entries: { Entry } = {}

local function capture()
	table.clear(entries)
	centurion.set_logger(function(level, message, info)
		table.insert(entries, { level = level, message = message, info = info })
	end)
end

local function message(ctx: centurion.Context): string?
	return ctx.response and ctx.response.message
end

local function throws()
	error("boom")
end

TEST("logger", function()
	capture()

	CASE("a throwing callback is logged as an error with a traceback")
	centurion.register_command("log_throw", {
		callback = function()
			throws()
		end,
	})
	local ctx = centurion.execute_command(carol, "log_throw", {}, "log_throw")
	CHECK(message(ctx) == "Failed to execute command.")
	CHECK(#entries == 1)
	local entry = entries[1]
	CHECK(entry.level == "error")
	CHECK(string.find(entry.message, "Failed to execute 'log_throw'", 1, true) ~= nil)
	CHECK(string.find(entry.message, "boom", 1, true) ~= nil)
	CHECK(entry.info.executor == carol)
	CHECK(entry.info.command == "log_throw")
	CHECK(entry.info.input == "log_throw")

	CASE("the traceback points at the code that threw")
	local traceback = entry.info.traceback
	CHECK(traceback ~= nil and string.find(traceback, "function throws", 1, true) ~= nil)
	CHECK(traceback ~= nil and string.sub(traceback, -1) ~= "\n")
	centurion.unregister_command("log_throw")

	CASE("a throwing guard is logged as an error with the guard's name")
	table.clear(entries)
	centurion.register_guard("log_guard_throw", function()
		throws()
		return true
	end)
	centurion.register_command("log_guarded", {
		guards = { "log_guard_throw" },
		callback = function()
			return "ran"
		end,
	})
	ctx = centurion.execute_command(carol, "log_guarded")
	CHECK(message(ctx) == "Failed to execute command.")
	CHECK(#entries == 1 and entries[1].level == "error")
	CHECK(entries[1].info.guard == "log_guard_throw")
	CHECK(entries[1].info.command == "log_guarded")
	CHECK(entries[1].info.traceback ~= nil)
	centurion.unregister_command("log_guarded")
	centurion.unregister_guard("log_guard_throw")

	CASE("a guard returning a non-boolean is logged as a warning")
	table.clear(entries)
	local remove = centurion.add_global_guard(function(): any
		return nil
	end)
	centurion.register_command("log_ok", {
		callback = function()
			return "ran"
		end,
	})
	centurion.execute_command(carol, "log_ok")
	CHECK(#entries == 1 and entries[1].level == "warn")
	CHECK(entries[1].info.traceback == nil)
	remove()

	CASE("a successful command logs nothing")
	table.clear(entries)
	ctx = centurion.execute_command(carol, "log_ok")
	CHECK(message(ctx) == "ran")
	CHECK(#entries == 0)
	centurion.unregister_command("log_ok")

	CASE("an arity mismatch is logged as a warning at registration")
	table.clear(entries)
	centurion.register_command(
		"log_arity",
		{
			arguments = function()
				return centurion.args.string("a")
			end,
			callback = function(_ctx, _a: string, _b: string) end,
		} :: any
	)
	CHECK(#entries == 1 and entries[1].level == "warn")
	CHECK(entries[1].info.command == "log_arity")
	centurion.unregister_command("log_arity")

	centurion.set_logger(nil)
end)

return nil
