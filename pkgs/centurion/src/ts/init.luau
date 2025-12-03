local centurion = require(script.Parent)
local types = require("./types")

local CLASS_MARKER = {}

type Guard = string | types.Guard

type CommandOptions = {
	name: string?,
	description: string?,
	arguments: () -> { types.Argument }?,
	guards: { Guard }?,
}

type Metadata = {
	commands: { [string]: CommandOptions },
	groups: { [string | {}]: { string } },
	guards: { [string | {}]: { Guard } },
}

local metadata: { [any]: Metadata } = {}

local function get_metadata(target: { [any]: unknown }): Metadata
	if not metadata[target] then
		metadata[target] = {
			commands = {},
			groups = {},
			guards = {},
		}
	end
	return metadata[target]
end

local function command_decorator(options: CommandOptions)
	return function(target: { [any]: unknown }, key: string)
		get_metadata(target).commands[key] = options
	end
end

local function group_decorator(...: string)
	local group = { ... }

	return function(target: { [any]: unknown }, key: string?)
		get_metadata(target).groups[key or CLASS_MARKER] = group
	end
end

local function guard_decorator(...: Guard)
	local guards = { ... }

	return function(target: { [any]: unknown }, key: string?)
		get_metadata(target).guards[key or CLASS_MARKER] = guards
	end
end

local function register_classes()
	for class, class_metadata in metadata do
		if not class_metadata.commands then
			continue
		end

		local instance = setmetatable({}, class) :: { constructor: (unknown) -> any, [any]: unknown }
		instance:constructor()

		local class_group = class_metadata.groups[CLASS_MARKER]
		local class_guards = class_metadata.guards[CLASS_MARKER]

		for key, cmd in class_metadata.commands do
			local cmd_groups = class_group or {}
			if class_metadata.groups[key] then
				for _, group in class_metadata.groups[key] do
					table.insert(cmd_groups, group)
				end
			end

			local cmd_name = cmd.name or key
			if #cmd_groups > 0 then
				cmd_name = table.concat(cmd_groups, " ") .. " " .. cmd_name
			end

			local cmd_guards = cmd.guards or {}
			if class_guards then
				for _, guard in class_guards do
					table.insert(cmd_guards, 1, guard)
				end
			end

			if class_metadata.guards[key] then
				for _, guard in class_metadata.guards[key] do
					table.insert(cmd_guards, guard)
				end
			end

			local args = cmd.arguments
			centurion.register_command(cmd_name, {
				callback = function(ctx: types.ExecutionContext, ...)
					return (instance[key] :: any)(instance, ctx, ...)
				end,
				description = cmd.description,
				arguments = function()
					return table.unpack(args() :: any)
				end,
				guards = cmd_guards,
			})
		end
	end
	table.clear(metadata)
end

local function register_command<T...>(name: string, command_object: types.Command<T...>)
	local cmd = table.clone(command_object)

	local args = cmd.arguments
	cmd.arguments = function()
		return table.unpack(args() :: any)
	end
	centurion.register_command(name, cmd)
end

local exports = {
	Command = command_decorator,
	Group = group_decorator,
	Guard = guard_decorator,
	register_classes = register_classes,
	register_command = register_command,
}

for k, v in pairs(centurion :: any) do
	if exports[k] == nil then
		exports[k] = v
	end
end

return exports
