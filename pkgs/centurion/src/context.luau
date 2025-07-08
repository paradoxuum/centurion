local types = require("./types")

local function context(executor: Player, command: string, args: { string }): types.ExecutionContext
	local ctx = {
		executor = executor,
		command = command,
		input = command .. (#args > 0 and (" " .. table.concat(args, " ")) or ""),
		args = args,
	} :: types.ExecutionContext

	ctx.reply = function(message: string)
		ctx.response = {
			success = true,
			message = message,
			timestamp = os.time(),
		}
	end

	ctx.error = function(message: string)
		ctx.response = {
			success = false,
			message = message,
			timestamp = os.time(),
		}
	end

	return ctx
end

return context
