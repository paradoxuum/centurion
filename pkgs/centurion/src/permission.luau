local services = require("./services")
local types = require("./types")

type PermissionOptions = {
	hide: boolean?,
	default_roles: { string }?,
}

local roles: { [string]: types.PermissionRole } = {}
local players: { [number]: { string } } = {}
local opts: PermissionOptions = {
	hide = true,
}
local changed_callbacks: { [number]: { (roles: { string }) -> () } } = {}
local options_callbacks: { (options: PermissionOptions) -> () } = {}

local player_removing_connection: RBXScriptConnection?

-- per-player state is cleared when they leave. this is connected on first use
-- rather than at load so that requiring this module never touches the datamodel
local function track_players()
	if player_removing_connection then
		return
	end

	player_removing_connection = services.Players.PlayerRemoving:Connect(function(player)
		players[player.UserId] = nil
		changed_callbacks[player.UserId] = nil
	end)
end

export type RoleOptions = {
	permissions: { string }?,
	inherits: { string }?,
}

type Resolved = { roles: { [string]: true }, permissions: { [string]: true } }

local resolved: { [string]: Resolved } = {}

local function create_role(name: string, options: RoleOptions?)
	assert(roles[name] == nil, `Role '{name}' is already registered.`)

	local permission_set: { [string]: boolean } = {}
	local inherits = if options and options.inherits then table.clone(options.inherits) else {}
	local granted = {
		roles = { [name] = true :: true },
		permissions = {},
	}

	if options and options.permissions then
		for _, perm in options.permissions do
			permission_set[perm] = true
			granted.permissions[perm] = true
		end
	end

	for _, parent_name in inherits do
		local parent = resolved[parent_name]
		assert(parent, `Role '{name}' inherits from '{parent_name}', which is not registered.`)

		for role_name in parent.roles do
			granted.roles[role_name] = true
		end
		for perm in parent.permissions do
			granted.permissions[perm] = true
		end
	end

	roles[name] = {
		name = name,
		permissions = permission_set,
		inherits = inherits,
	}
	resolved[name] = granted
end

local function get_roles(player: Player): { string }
	local current = players[player.UserId]
	return if current then table.clone(current) else {}
end

local function set_roles(player: Player, role_names: { string })
	for _, role_name in role_names do
		if not roles[role_name] then
			error("Role '" .. role_name .. "' does not exist.")
		end
	end

	if player.Parent ~= services.Players then
		return
	end

	track_players()
	players[player.UserId] = table.clone(role_names)

	local callbacks = changed_callbacks[player.UserId]
	if callbacks then
		for _, callback in table.clone(callbacks) do
			callback(table.clone(role_names))
		end
	end
end

local function add_roles(player: Player, ...: string)
	local new_roles = players[player.UserId] and table.clone(players[player.UserId]) or {}
	for _, role_name in { ... } do
		if table.find(new_roles, role_name) then
			continue
		end
		table.insert(new_roles, role_name)
	end
	set_roles(player, new_roles)
end

local function remove_roles(player: Player, ...: string)
	local current_roles = players[player.UserId]
	if not current_roles then
		return
	end

	local role_names = { ... }
	local new_roles: { string } = {}
	for _, role_name in current_roles do
		if table.find(role_names, role_name) then
			continue
		end
		table.insert(new_roles, role_name)
	end
	set_roles(player, new_roles)
end

-- calls `check` with what each of the player's roles grants, assigned roles
-- first and then default roles, until it returns true
local function any_granted(player: Player, check: (granted: Resolved) -> boolean): boolean
	local assigned = players[player.UserId]
	if assigned then
		for _, role_name in assigned do
			local granted = resolved[role_name]
			if granted and check(granted) then
				return true
			end
		end
	end

	if opts.default_roles then
		for _, role_name in opts.default_roles do
			local granted = resolved[role_name]
			if granted and check(granted) then
				return true
			end
		end
	end

	return false
end

local function has_permission(player: Player, permission: string): boolean
	if not services.RunService:IsRunning() then
		return true
	end

	return any_granted(player, function(granted)
		return granted.permissions[permission] == true
	end)
end

local function can_execute(player: Player, command: types.Command<unknown>): boolean
	if not services.RunService:IsRunning() then
		return true
	end

	local required_roles = command.roles or {}
	local required_permissions = command.permissions or {}
	if #required_roles == 0 and #required_permissions == 0 then
		return true
	end

	return any_granted(player, function(granted)
		for _, role_name in required_roles do
			if granted.roles[role_name] then
				return true
			end
		end

		for _, permission in required_permissions do
			if granted.permissions[permission] then
				return true
			end
		end

		return false
	end)
end

local function set_permission_options(options: PermissionOptions)
	if options.hide ~= nil then
		opts.hide = options.hide
	end

	-- default roles aren't copied into each player's roles, they're checked
	-- alongside them. so set_roles can't remove them and there's no PlayerAdded
	-- ordering to get wrong
	if options.default_roles ~= nil then
		for _, role_name in options.default_roles do
			if not roles[role_name] then
				error("Role '" .. role_name .. "' does not exist.")
			end
		end
		opts.default_roles = table.clone(options.default_roles)
	end

	for _, callback in options_callbacks do
		callback(opts)
	end
end

local function on_roles_changed(player: Player, callback: (roles: { string }) -> ())
	track_players()

	if not changed_callbacks[player.UserId] then
		changed_callbacks[player.UserId] = {}
	end
	table.insert(changed_callbacks[player.UserId], callback)

	return function()
		local callbacks = changed_callbacks[player.UserId]
		if not callbacks then
			return
		end

		local index = table.find(callbacks, callback)
		if index then
			table.remove(callbacks, index)
		end

		if #callbacks == 0 then
			changed_callbacks[player.UserId] = nil
		end
	end
end

local function on_options_changed(callback: (options: PermissionOptions) -> ())
	table.insert(options_callbacks, callback)
	return function()
		local index = table.find(options_callbacks, callback)
		if index then
			table.remove(options_callbacks, index)
		end
	end
end

return {
	create_role = create_role,
	get_roles = get_roles,
	set_roles = set_roles,
	add_roles = add_roles,
	remove_roles = remove_roles,
	can_execute = can_execute,
	has_permission = has_permission,
	set_permission_options = set_permission_options,
	on_roles_changed = on_roles_changed,
	on_options_changed = on_options_changed,
	roles = roles,
	options = opts,
}
