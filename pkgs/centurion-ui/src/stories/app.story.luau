local app = require("../app")
local centurion = require("../../centurion")
local story = require("./story")
local ui = require("../../src")

return story({}, function()
	ui.register_commands()

	centurion.command.register("test test2", {
		description = "Test command",
		arguments = function()
			return centurion.types.number("arg1", "test argument", {
				suggestions = { "1", "2", "invalid number" },
				num_args = 3,
			}),
				centurion.types.boolean("arg2", "test argument 2")
		end,
		callback = function(...)
			print("test1:", ...)
		end,
	})

	centurion.command.register("echo", {
		description = "Prints the input back to the console",
		arguments = function()
			return centurion.types.string("input", nil, {
				num_args = "rest",
			})
		end,
		callback = function(ctx, text)
			ctx.reply(table.concat(text, " "))
		end,
	})

	return app()
end)
