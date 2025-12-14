--!nonstrict
local Players = game:GetService("Players")

local argument = require("./.")
local result = require("../result")
local types = require("../types")

local register = argument.register

local function get_player(name: string, executor: Player): Player?
	local name_lower = name:lower()
	if name_lower == "@me" or name_lower == "." then
		return executor
	end

	if name_lower == "@random" or name_lower == "?" then
		local players = Players:GetPlayers()
		return players[math.random(1, #players)]
	end

	local player = Players:FindFirstChild(name)
	if player then
		return player
	end

	for _, p in Players:GetPlayers() do
		if p.Name:lower() == name_lower then
			return p
		end
	end

	return nil
end

local player = register("player", {
	transform = function(value: string, executor: Player): types.Result
		local plr = get_player(value, executor)
		if plr == nil then
			return result.error(`Player '{value}' not found.`)
		end
		return result.success(plr)
	end,
	suggestions = function(_value: string, _executor: Player): { string }
		local suggestions = { "@me", "@random" }
		for _, p in Players:GetPlayers() do
			table.insert(suggestions, p.Name)
		end
		return suggestions
	end,
})

local players = register("players", {
	transform = function(value: string, executor: Player): types.Result
		local target = get_player(value, executor)
		if target == nil then
			return result.error(`Player '{value}' not found.`)
		end
		return result.success({ target })
	end,
	suggestions = function(_value: string, _executor: Player): { string }
		local suggestions: { string } = { "@me", "@random" }
		for _, p in Players:GetPlayers() do
			table.insert(suggestions, p.Name)
		end
		return suggestions
	end,
})

return {
	player = player :: types.ArgumentFn<Player>,
	players = players :: types.ArgumentFn<{ Player }>,
}
