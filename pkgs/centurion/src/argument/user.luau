local argument = require("./.")
local player = require("./player")
local result = require("../result")
local services = require("../services")
local types = require("../types")

export type UserInfo = {
	id: number,
	name: string,
	player: Player?,
}

local function from_player(p: Player): UserInfo
	return { id = p.UserId, name = p.Name, player = p }
end

local function is_me(text: string): boolean
	local lower = text:lower()
	return lower == "@me" or lower == "."
end

-- `#` followed by a user ID
local function parse_id(text: string): number?
	local digits = text:match("^#(%d+)$")
	local id = if digits then tonumber(digits) else nil
	return if id and id > 0 then id else nil
end

local function is_username(text: string): boolean
	return #text >= 3 and #text <= 20 and text:match("^[%w_]+$") ~= nil
end

-- doesn't look anything up, so it can't tell whether the user exists
local function check(text: string): string?
	if is_me(text) or parse_id(text) or is_username(text) then
		return nil
	end
	return `'{text}' is not a valid username or #id.`
end

local function by_id(id: number): types.Result<UserInfo>
	local online = services.Players:GetPlayerByUserId(id)
	if online then
		return result.success(from_player(online))
	end

	local ok, name = pcall(services.Players.GetNameFromUserIdAsync, services.Players, id)
	if not ok then
		return result.error(`User #{id} not found.`)
	end
	local user: UserInfo = { id = id, name = name }
	return result.success(user)
end

-- online players are matched by exact username without a lookup. anyone else
-- is looked up, which yields
local function find_user(text: string, executor: Player): types.Result<UserInfo>
	local err = check(text)
	if err then
		return result.error(err)
	end

	if is_me(text) then
		return result.success(from_player(executor))
	end

	local id = parse_id(text)
	if id then
		return by_id(id)
	end

	local lower = text:lower()
	for _, p in services.Players:GetPlayers() do
		if p.Name:lower() == lower then
			return result.success(from_player(p))
		end
	end

	-- this also finds previous usernames, so get the current one
	local ok, found = pcall(services.Players.GetUserIdFromNameAsync, services.Players, text)
	if not ok then
		return result.error(`User '{text}' not found.`)
	end

	local res = by_id(found)
	if res.success then
		return res
	end

	local user: UserInfo = { id = found, name = text }
	return result.success(user)
end

return argument.register_type("user", {
	transform = function(text: string, executor: Player): types.Result<UserInfo>
		return find_user(text, executor)
	end,
	check = check,
	suggestions = function()
		return player.suggestions(false, false)
	end,
})
