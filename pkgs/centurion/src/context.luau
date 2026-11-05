local types = require("./types")

local function context(executor: Player, command: string, args: { string }, input: string?): types.ExecutionContext
	local ctx = {
		executor = executor,
		command = command,
		input = input or (command .. (#args > 0 and (" " .. table.concat(args, " ")) or "")),
		arguments = args,
	} :: types.ExecutionContext

	-- the response is serialized after the handler returns, where a non-string
	-- message would fail and leave the client waiting, so coerce it here
	ctx.reply = function(message: string)
		ctx.response = {
			success = true,
			message = tostring(message),
			timestamp = os.time(),
		}
	end

	ctx.error = function(message: string)
		ctx.response = {
			success = false,
			message = tostring(message),
			timestamp = os.time(),
		}
	end

	return ctx
end

return context
