local types = require("./types")

local function success(value: unknown): types.Ok
	return {
		success = true,
		value = value,
	}
end

local function error(message: string): types.Err
	return {
		success = false,
		error = message,
	}
end

return {
	success = success,
	error = error,
}
