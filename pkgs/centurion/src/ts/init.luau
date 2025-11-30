local centurion = require(script.Parent)
local command = require("./command")
local types = require("./types")

local NO_PROP_MARKER = {}
local CENTURION_KEY = "centurion"
local COMMAND_KEY = "command"

type Guard = string | types.Guard

type ClassOptions = {
	group: string?,
	guards: { Guard }?,
}

type CommandOptions = {
	name: string?,
	description: string?,
	arguments: () -> { types.Argument }?,
	guards: { Guard }?,
}

type Table = { [any]: any }

local metadata: Table = {}

local function get_or_create(obj: unknown, prop: string?)
	local key = prop or NO_PROP_MARKER
	local obj_metadata = metadata[obj]
	if not obj_metadata then
		obj_metadata = {}
		metadata[obj] = obj_metadata
	end

	local prop_metadata = obj_metadata[key]
	if not prop_metadata then
		prop_metadata = {}
		obj_metadata[key] = prop_metadata
	end
	return prop_metadata :: { [any]: unknown }
end

local function get(obj: unknown, prop: string?)
	local key = prop or NO_PROP_MARKER
	return metadata[obj][key] :: { [any]: unknown } | nil
end

local function register(options: ClassOptions)
	return function(target: Table)
		local obj = setmetatable({}, target) :: { constructor: (unknown) -> any, [any]: unknown }
		obj:constructor()

		local data = get_or_create(obj)
		data[CENTURION_KEY] = options
	end
end

local function command_decorator(options: CommandOptions)
	return function(target: { [any]: unknown }, key: string)
		local data = get(target, key)
		assert(data, "Class must be decorated with @Centurion()")

		-- TODO: register command
		data[COMMAND_KEY] = options
		command.register(
			options.name or key,
			{
				callback = target[key],
				description = options.description,
				arguments = options.arguments,
				guards = options.guards,
			} :: any
		)
	end
end

-- local function Command(options: CommandOptions)
-- 	return function(target: { [any]: unknown }, key: string)
-- 		local register_opts = {
-- 			callback = target[key],
-- 		}
-- 		for k, v in pairs(options :: { [string]: unknown }) do
-- 			register_opts[k] = v
-- 		end

-- 		command.register(options.name or key, register_opts :: types.Command)
-- 	end
-- end

-- local function Group(name: string)
-- 	return function(target: { [any]: unknown }, key: string?)
-- 		groups[target] = key
-- 	end
-- end

-- return {
-- 	Command = Command,
-- }

local exports = {
	Register = register,
	Command = command_decorator,
}

for k, v in pairs(centurion :: any) do
	exports[k] = v
end

print(exports)

return exports
