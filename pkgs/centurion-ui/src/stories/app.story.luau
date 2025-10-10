local app = require("../app")
local centurion = require("../../centurion")
local state = require("../state")
local story = require("./story")
local theme = require("../theme")
local types = require("../types")

return story({}, function()
	local theme_names = {}
	for name in pairs(theme.themes :: { [string]: types.Theme }) do
		table.insert(theme_names, name)
	end
	local theme_arg = centurion.arg.register("theme", centurion.arg.enum(theme_names))

	centurion.command.register("centurion clear", {
		description = "Clear the command history",
		callback = function()
			state.logs({})
			return ""
		end,
	})
	centurion.command.register("centurion theme", {
		description = "Change the theme",
		arguments = function()
			return theme_arg("theme", "The name of the theme to switch to")
		end,
		callback = function(ctx, theme_name)
			local data = theme.themes[theme_name]
			if not data then
				ctx.error("Theme '" .. theme_name .. "' does not exist.")
				return
			end

			state.theme(data)
			return `Theme changed to {theme_name}`
		end,
	})

	centurion.command.register("test test", {
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
