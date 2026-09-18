local app = require("../app")
local centurion = require("../../centurion")
local story = require("./story")
local ui = require("../../src")
local px = require("../px")
local state = require("../state")

return story({}, function()
	ui.register_commands()
	state.opened(true)

	local cmd = centurion.register_command

	cmd("test test2", {
		description = "Test command",
		arguments = function()
			return centurion.num_args(centurion.args.number("arg1", "test argument", {
				 "1", "2", "invalid number"
			}), 3),
			centurion.args.boolean("arg2", "test argument 2")
		end,
		callback = function(...)
			print("test1:", ...)
		end,
	})

	cmd("echo", {
		description = "Prints the input back to the console",
		arguments = function()
			return centurion.num_args(centurion.args.string("input", nil), "rest")
		end,
		callback = function(ctx, text)
			ctx.reply(table.concat(text, " "))
		end,
	})

	px.mount()

	return app()
end)
