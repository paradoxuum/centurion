local argument = require("@self/argument")
local builtin = require("@self/builtin")
local command = require("@self/command")
local guard = require("@self/guard")
local sync = require("@self/sync")
local types = require("@self/types")

export type Result = types.Result
export type Context = types.ExecutionContext
export type Response = types.Response

return {
	arg = argument,
	builtin = builtin,
	command = command,
	guard = guard,
	sync = sync,
}
