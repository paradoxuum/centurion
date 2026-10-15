-- everything the core reports goes through here so that it can be routed to a
-- logging or analytics service with `set_logger`.
--
-- "error" is for exceptions thrown by user code (guards and callbacks) and
-- carries a traceback. "warn" is for misconfiguration that doesn't stop the
-- core from working.

export type LogLevel = "warn" | "error"

export type LogInfo = {
	executor: Player?,
	command: string?,
	input: string?,
	guard: string?,
	traceback: string?,
}

export type Logger = (level: LogLevel, message: string, info: LogInfo) -> ()

export type CaughtError = {
	message: string,
	traceback: string,
}

local function default_logger(_level: LogLevel, message: string, info: LogInfo)
	if info.traceback then
		warn(`{message}\n{info.traceback}`)
	else
		warn(message)
	end
end

local logger: Logger = default_logger

local function set_logger(callback: Logger?)
	logger = callback or default_logger
end

local function log(level: LogLevel, message: string, info: LogInfo?)
	local log_info: LogInfo = info or {}

	-- a broken logger shouldn't take down whatever was being reported, so
	-- fall back to the default rather than letting the error propagate
	local ok, err = pcall(logger, level, message, log_info)
	if not ok then
		default_logger("warn", `Logger failed: {err}`, {})
		default_logger(level, message, log_info)
	end
end

-- an `xpcall` handler. it runs where the error was thrown, so the traceback
-- still points into the code that threw rather than at the `xpcall`.
local function capture(err: unknown): CaughtError
	local traceback = string.gsub(debug.traceback(nil, 2), "\n$", "")

	return {
		message = tostring(err),
		traceback = traceback,
	}
end

return {
	set_logger = set_logger,
	warn = function(message: string, info: LogInfo?)
		log("warn", message, info)
	end,
	error = function(message: string, info: LogInfo?)
		log("error", message, info)
	end,
	capture = capture,
}
