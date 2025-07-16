local app = require("../app")
local centurion = require("../../centurion")
local story = require("./story")

return story({}, function()
	centurion.builtin.register_types()
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
				num_args = 2,
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
	centurion.command.register("test2", {
		description = "Test command 2",
		arguments = {},
		callback = function(ctx)
			print("test2:", ctx)
		end,
	})

	return app()
end)
