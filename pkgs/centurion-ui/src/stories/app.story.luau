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

	cmd("wait", {
        description = "Waits for a specified amount of time",
        arguments = function()
            return centurion.num_args(centurion.args.number("time", "Time to wait in seconds"), 1)
        end,
        callback = function(ctx, time)
            task.wait(time)
            ctx.reply(`Waited for {time} second(s)!`)
        end,
    })

	cmd("lorem", {
        description = "Lorem ipsum",
        callback = function(ctx, text)
            ctx.reply("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.")
        end,
    })

	px.mount()

	return app()
end)
