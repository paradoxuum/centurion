--!nonstrict
local Players = game:GetService("Players")

local argument = require("./.")
local result = require("../result")
local types = require("../types")

local register = argument.register_type

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

local players_type = argument.register_list_type("players", {
	transform = function(input: { string }, executor: Player): types.Result
		local player_map = {}
		for _, text in input do
			local text_lower = text:lower()
			if text_lower == "@all" then
				return result.success(Players:GetPlayers())
			end

			if text_lower == "@others" then
				for _, p in Players:GetPlayers() do
					if p ~= executor then
						player_map[p] = true
					end
				end
				continue
			end

			if text_lower == "@random" then
				local players = Players:GetPlayers()
				local random_player = players[math.random(1, #players)]
				player_map[random_player] = true
				continue
			end

			local plr = get_player(text, executor)
			if plr == nil then
				return result.error(`Player '{text}' not found.`)
			end
			player_map[plr] = true
		end

		local players = {}
		for player, _ in player_map do
			table.insert(players, player)
		end
		return result.success(players)
	end,
	suggestions = function(_value: string, _executor: Player): { string }
		local suggestions: { string } = { "@me", "@random", "@all", "@others" }
		for _, p in Players:GetPlayers() do
			table.insert(suggestions, p.Name)
		end
		return suggestions
	end,
})

return {
	player = player :: types.ArgumentFn<Player>,
	players = players_type :: types.ArgumentFn<{ Player }>,
}
