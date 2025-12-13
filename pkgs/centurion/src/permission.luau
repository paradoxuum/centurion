local Players = game:GetService("Players")

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

local player_added_connection: RBXScriptConnection?

local function create_role(name: string, priority: number, permissions: { string }?)
	local permission_set = {}

	if permissions then
		for _, perm in permissions do
			permission_set[perm] = true
		end
	end

	roles[name] = {
		name = name,
		priority = priority,
		permissions = permission_set,
	}
end

local function get_roles(player: Player): { string }
	return players[player.UserId] or {}
end

local function set_roles(player: Player, role_names: { string })
	for _, role_name in role_names do
		if not roles[role_name] then
			error("Role '" .. role_name .. "' does not exist.")
		end
	end
	players[player.UserId] = role_names

	local callbacks = changed_callbacks[player.UserId]
	if callbacks then
		for _, callback in callbacks do
			callback(role_names)
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

local function can_execute(player: Player, command: types.Command<unknown>): boolean
	local user_roles = players[player.UserId]
	if not user_roles then
		return (not command.roles or #command.roles == 0) and (not command.permissions or #command.permissions == 0)
	end

	if (not command.roles or #command.roles == 0) and (not command.permissions or #command.permissions == 0) then
		return true
	end

	if command.roles then
		for _, role_name in command.roles do
			local role = roles[role_name]
			for _, user_role_name in user_roles do
				local user_role = roles[user_role_name]
				if user_role and role and user_role.priority <= role.priority then
					return true
				end
			end
		end
	end

	if command.permissions then
		for _, role_name in user_roles do
			local role = roles[role_name]
			if not role then
				continue
			end

			local role_perms = role.permissions
			for _, other_role in roles do
				if other_role.priority < role.priority then
					for perm, _ in other_role.permissions do
						role_perms[perm] = true
					end
				end
			end

			local permission_count = 0
			local permissions_met = 0
			for _, permission in command.permissions do
				permission_count += 1

				if role_perms[permission] then
					permissions_met += 1
					return true
				end
			end

			if permission_count == permissions_met then
				return true
			end
		end
	end

	return false
end

local function set_permission_options(options: PermissionOptions)
	if options.hide ~= nil then
		opts.hide = options.hide
	end

	if options.default_roles ~= nil then
		opts.default_roles = options.default_roles

		if #options.default_roles > 0 then
			player_added_connection = Players.PlayerAdded:Connect(function(player)
				add_roles(player, unpack(options.default_roles))
			end)
		elseif player_added_connection then
			player_added_connection:Disconnect()
			player_added_connection = nil
		end
	end

	for _, callback in options_callbacks do
		callback(opts)
	end
end

local function on_roles_changed(player: Player, callback: (roles: { string }) -> ())
	if not changed_callbacks[player.UserId] then
		changed_callbacks[player.UserId] = {}
	end
	table.insert(changed_callbacks[player.UserId], callback)

	return function()
		changed_callbacks[player.UserId] = nil
	end
end

local function on_options_changed(callback: (options: PermissionOptions) -> ())
	table.insert(options_callbacks, callback)
	return function()
		table.remove(options_callbacks, table.find(options_callbacks, callback))
	end
end

Players.PlayerRemoving:Connect(function(player)
	players[player.UserId] = nil
	changed_callbacks[player.UserId] = nil
end)

return {
	create_role = create_role,
	get_roles = get_roles,
	set_roles = set_roles,
	add_roles = add_roles,
	remove_roles = remove_roles,
	can_execute = can_execute,
	set_permission_options = set_permission_options,
	on_roles_changed = on_roles_changed,
	on_options_changed = on_options_changed,
	roles = roles,
	options = opts,
}
