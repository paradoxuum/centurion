local centurion = require(script.Parent)
local types = require("./types")

local CLASS_MARKER = {}

type Guard = string | types.Guard

type CommandOptions = {
	name: (string | { string })?,
	description: string?,
	arguments: () -> { types.Argument }?,
	guards: { Guard }?,
	roles: { string }?,
	permissions: { string }?,
}

type Metadata = {
	commands: { [string]: CommandOptions },
	groups: { [string | {}]: { string } },
	guards: { [string | {}]: { Guard } },
	roles: { [string | {}]: { string } },
	permissions: { [string | {}]: { string } },
}

local metadata: { [any]: Metadata } = {}

local function get_metadata(target: { [any]: unknown }): Metadata
	if not metadata[target] then
		metadata[target] = {
			commands = {},
			groups = {},
			guards = {},
			roles = {},
			permissions = {},
		}
	end
	return metadata[target]
end

local function collect_metadata(key: string, class_data: { [any]: { any } }, cmd_data: any?)
	local data = table.clone(cmd_data or {}) :: { any }
	if class_data[CLASS_MARKER] then
		for _, v in class_data[CLASS_MARKER] do
			table.insert(data, 1, v)
		end
	end

	if class_data[key] then
		for _, v in class_data[key] do
			table.insert(data, v)
		end
	end

	return data
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

local function role_decorator(...: string)
	local roles = { ... }

	return function(target: { [any]: unknown }, key: string?)
		get_metadata(target).roles[key or CLASS_MARKER] = roles
	end
end

local function permission_decorator(...: string)
	local permissions = { ... }

	return function(target: { [any]: unknown }, key: string?)
		get_metadata(target).permissions[key or CLASS_MARKER] = permissions
	end
end

local function register_classes(constructor)
	for class, class_metadata in metadata do
		if not class_metadata.commands then
			continue
		end

		local instance: { [any]: unknown }
		if constructor then
			instance = constructor(class)
			assert(type(instance) == "table", "Constructor function must return an object")
		else
			instance = setmetatable({}, class) :: { constructor: (unknown) -> any, [any]: unknown }
			instance:constructor()
		end

		local class_group = class_metadata.groups[CLASS_MARKER]

		for key, cmd in class_metadata.commands do
			local cmd_groups = class_group or {}
			if class_metadata.groups[key] then
				for _, group in class_metadata.groups[key] do
					table.insert(cmd_groups, group)
				end
			end

			local cmd_name = cmd.name or key
			if type(cmd_name) == "string" then
				cmd_name = { cmd_name }
			end

			if #cmd_groups > 0 then
				local group_prefix = table.concat(cmd_groups, " ")
				for i, name in cmd_name :: { string } do
					(cmd_name :: { string })[i] = group_prefix .. " " .. name
				end
			end

			local args = cmd.arguments
			centurion.register_command(
				cmd_name,
				{
					callback = function(ctx: types.ExecutionContext, ...)
						return (instance :: any)[key](instance, ctx, ...)
					end,
					description = cmd.description,
					arguments = args and function()
						return table.unpack(args() :: any)
					end or nil,
					guards = collect_metadata(key, class_metadata.guards, cmd.guards),
					roles = collect_metadata(key, class_metadata.roles, cmd.roles),
					permissions = collect_metadata(key, class_metadata.permissions, cmd.permissions),
				} :: types.Command<unknown>
			)
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
	Role = role_decorator,
	Permission = permission_decorator,
	register_classes = register_classes,
	register_command = register_command,
}

for k, v in pairs(centurion :: any) do
	if exports[k] == nil then
		exports[k] = v
	end
end

return exports
