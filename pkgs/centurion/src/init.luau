local argument = require("@self/argument")
local color = require("@self/argument/color")
local command = require("@self/command")
local duration = require("@self/argument/duration")
local guard = require("@self/guard")
local parse = require("@self/parse")
local permission = require("@self/permission")
local player = require("@self/argument/player")
local primitives = require("@self/argument/primitives")
local sync = require("@self/sync")
local team = require("@self/argument/team")
local types = require("@self/types")
local vector = require("@self/argument/vector")

export type Argument = types.Argument
export type Command<T...> = types.Command<T...>

export type Result = types.Result
export type Context = types.ExecutionContext
export type Response = types.Response

export type Token = parse.Token
export type ParseResult = parse.ParseResult

return {
	register_command = command.register,
	register_guard = guard.register,
	register_type = argument.register_type,
	register_list_type = argument.register_list_type,
	unregister_command = command.unregister,

	create_enum = argument.enum,
	optional = argument.optional,
	num_args = argument.num_args,
	transform_args = argument.transform,

	execute_command = command.execute,
	set_network_handler = command.set_network_handler,
	setup_networking = sync.setup,

	create_role = permission.create_role,
	set_roles = permission.set_roles,
	get_roles = permission.get_roles,
	add_roles = permission.add_roles,
	remove_roles = permission.remove_roles,
	can_execute = permission.can_execute,
	set_permission_options = permission.set_permission_options,

	parse_text = parse,

	registry = {
		commands = command.commands,
		types = argument.types,
		guards = guard.guards,
		global_guards = guard.global_guards,
		roles = permission.roles,
	},
	sync = sync,
	args = {
		string = primitives.string,
		boolean = primitives.boolean,
		number = primitives.number,
		integer = primitives.integer,
		player = player.player,
		players = player.players,
		brick_color = color.brick_color,
		hex_color = color.hex_color,
		team = team,
		duration = duration,
		vector2 = vector.vector2,
		vector3 = vector.vector3,
	},
	events = {
		on_command_register = command.on_register,
		on_command_unregister = command.on_unregister,
		on_command_execute = command.on_execute,
		on_roles_changed = permission.on_roles_changed,
	},
}
