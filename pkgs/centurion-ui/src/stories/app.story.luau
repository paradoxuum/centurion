local app = require("../app")
local centurion = require("../../centurion")
local story = require("./story")
local ui = require("../../src")

return story({}, function()
	ui.register_commands()

	local cmd = centurion.register_command

	cmd("test test2", {
		description = "Test command",
		arguments = function()
			return centurion.args.number("arg1", "test argument", {
				suggestions = { "1", "2", "invalid number" },
				num_args = 3,
			}),
				centurion.args.boolean("arg2", "test argument 2")
		end,
		callback = function(...)
			print("test1:", ...)
		end,
	})

	cmd("echo", {
		description = "Prints the input back to the console",
		arguments = function()
			return centurion.args.string("input", nil, {
				num_args = "rest",
			})
		end,
		callback = function(ctx, text)
			ctx.reply(table.concat(text, " "))
		end,
	})

	return app()
end)
