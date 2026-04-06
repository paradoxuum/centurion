local types = require("./types")

local function success(value: unknown): types.Result
	return {
		success = true,
		value = value,
	}
end

local function error(message: string): types.Result
	return {
		success = false,
		error = message,
	}
end

return {
	success = success,
	error = error,
}
