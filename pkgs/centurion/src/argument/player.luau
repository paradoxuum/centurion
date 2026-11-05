local argument = require("./.")
local result = require("../result")
local services = require("../services")
local types = require("../types")

local register = argument.register_type

-- how many players an ambiguous match lists before summarising the rest
local MAX_LISTED = 5

type Tier = (player: Player, text: string) -> boolean

local function exact_name(player: Player, text: string): boolean
	return player.Name:lower() == text
end

-- strict types only match usernames, which are unique and can't be changed
-- mid-game, so a target leaving can't redirect a command to someone else
local strict_tiers: { Tier } = { exact_name }

-- tried in order, and the first tier with any match decides. exact usernames
-- come first so that a display name copying someone's username can't take
-- their place, and prefixes only count when nothing matches exactly
local fuzzy_tiers: { Tier } = {
	exact_name,
	function(player, text)
		return player.DisplayName:lower() == text
	end,
	function(player, text)
		return player.Name:lower():sub(1, #text) == text
	end,
	function(player, text)
		return player.DisplayName:lower():sub(1, #text) == text
	end,
}

local function not_found(text: string): types.Err
	return result.error(`Player '{text}' not found.`)
end

local function ambiguous(text: string, found: { Player }): types.Err
	local names = {}
	for _, player in found do
		table.insert(names, player.Name)
	end
	table.sort(names)

	local listed = table.concat(names, ", ", 1, math.min(#names, MAX_LISTED))
	if #names > MAX_LISTED then
		listed ..= ` and {#names - MAX_LISTED} more`
	end

	return result.error(`'{text}' matches more than one player: {listed}.`)
end

local function random_player(): types.Result<Player>
	local players = services.Players:GetPlayers()
	if #players == 0 then
		return result.error("There are no players to choose from.")
	end
	return result.success(players[math.random(1, #players)])
end

local function find_player(text: string, executor: Player, tiers: { Tier }): types.Result<Player>
	local lower = text:lower()
	if lower == "@me" or lower == "." then
		return result.success(executor)
	end

	if lower == "@random" or lower == "?" then
		return random_player()
	end

	-- an empty prefix would match everyone
	if lower == "" then
		return not_found(text)
	end

	local players = services.Players:GetPlayers()
	for _, tier in tiers do
		local found = {}
		for _, player in players do
			if tier(player, lower) then
				table.insert(found, player)
			end
		end

		if #found == 1 then
			return result.success(found[1])
		elseif #found > 1 then
			return ambiguous(text, found)
		end
	end

	return not_found(text)
end

-- usernames are inserted since they're unique, but can be found by display name
local function player_suggestions(specials: { types.SuggestionData }): { types.Suggestion }
	local suggestions: { types.Suggestion } = table.clone(specials) :: any
	for _, player in services.Players:GetPlayers() do
		if player.DisplayName == player.Name then
			table.insert(suggestions, player.Name)
		else
			table.insert(suggestions, {
				text = player.Name,
				description = player.DisplayName,
				aliases = { player.DisplayName },
			})
		end
	end
	return suggestions
end

local player_specials: { types.SuggestionData } = {
	{ text = "@me", description = "Yourself" },
	{ text = "@random", description = "A random player" },
}

local players_specials: { types.SuggestionData } = {
	{ text = "@me", description = "Yourself" },
	{ text = "@random", description = "A random player" },
	{ text = "@all", description = "Every player" },
	{ text = "@others", description = "Every player except you" },
}

local function register_types(single: string, list: string, tiers: { Tier })
	local single_type = register(single, {
		transform = function(value: string, executor: Player): types.Result<Player>
			return find_player(value, executor, tiers)
		end,
		suggestions = function(_value: string, _executor: Player)
			return player_suggestions(player_specials)
		end,
	})

	local list_type = argument.register_list_type(list, {
		transform = function(input: { string }, executor: Player): types.Result<{ Player }>
			local player_map = {}
			for _, text in input do
				local text_lower = text:lower()
				if text_lower == "@all" then
					return result.success(services.Players:GetPlayers())
				end

				if text_lower == "@others" then
					for _, p in services.Players:GetPlayers() do
						if p ~= executor then
							player_map[p] = true
						end
					end
					continue
				end

				local res = find_player(text, executor, tiers)
				if not res.success then
					return res
				end
				player_map[res.value] = true
			end

			local players = {}
			for p, _ in player_map do
				table.insert(players, p)
			end
			return result.success(players)
		end,
		suggestions = function(_value: string, _executor: Player)
			return player_suggestions(players_specials)
		end,
	})

	return single_type, list_type
end

local player, players_type = register_types("player", "players", strict_tiers)
local fuzzy_player, fuzzy_players = register_types("fuzzy_player", "fuzzy_players", fuzzy_tiers)

return {
	player = player,
	players = players_type,
	fuzzy_player = fuzzy_player,
	fuzzy_players = fuzzy_players,
}
