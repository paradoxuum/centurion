local app = require("../app")
local centurion = require("../../centurion")
local state = require("../state")
local story = require("./story")
local theme = require("../theme")
local types = require("../types")

return story({}, function()
	centurion.builtin.register_types()

	local theme_names = {}
	for name in pairs(theme.themes :: { [string]: types.Theme }) do
		table.insert(theme_names, name)
	end
	centurion.arg.register("theme", centurion.arg.enum(theme_names))

	centurion.command.register("clear", {
		description = "Clear the command history",
		callback = function()
			state.logs({})
			return ""
		end,
	})
	centurion.command.register("theme", {
		description = "Change the theme",
		arguments = {
			{
				name = "theme",
				type = "theme",
				description = "The name of the theme to switch to",
			},
		},
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

	centurion.command.register("test", {
		description = "Test command",
		arguments = {
			{
				name = "arg1",
				type = "number",
				description = "test argument",
				suggestions = {
					"1",
					"2",
				},
				num_args = 3,
			},
			{
				name = "arg2",
				type = "boolean",
				description = "test argument 2",
			},
		},
		callback = function(...)
			print("test1:", ...)
		end,
	})

	centurion.command.register("echo", {
		description = "Prints the input back to the console",
		arguments = {
			{
				name = "input",
				type = "string",
				num_args = "rest",
			},
		},
		callback = function(ctx, text)
			ctx.reply(table.concat(text, " "))
		end,
	})

	return app()
end)
