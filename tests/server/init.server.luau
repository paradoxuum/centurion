--!nonstrict

local centurion = require("../pkgs/centurion/src")

centurion.setup_networking()

local function func_guard(ctx: centurion.Context)
	print("function guard executed for", ctx.command)
	return true
end

centurion.register_guard("string_guard", function(ctx)
	print("string guard executed for", ctx.command)
	return true
end)

centurion.register_command("test", {
	description = "A test command",
	arguments = function()
		return centurion.args.string("arg1", "The first argument")
	end,
	guards = { func_guard, "string_guard" },
	callback = function(ctx, arg)
		print(ctx, arg)
	end,
})
