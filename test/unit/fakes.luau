--!nonstrict
-- minimal stand-ins for the roblox services the core uses. requiring this
-- installs them into `services`, so require it before exercising anything that
-- reaches for Players, RunService or Teams.

local services = require("../../pkgs/centurion/src/services")

local function signal()
	local callbacks = {}

	return {
		Connect = function(_self, callback)
			table.insert(callbacks, callback)
			return {
				Disconnect = function()
					local index = table.find(callbacks, callback)
					if index then
						table.remove(callbacks, index)
					end
				end,
			}
		end,
		Fire = function(_self, ...)
			for _, callback in table.clone(callbacks) do
				callback(...)
			end
		end,
	}
end

local player_list = {}

local Players = {
	PlayerAdded = signal(),
	PlayerRemoving = signal(),
}

function Players:GetPlayers()
	return table.clone(player_list)
end

function Players:FindFirstChild(name)
	for _, player in player_list do
		if player.Name == name then
			return player
		end
	end
	return nil
end

local RunService = {
	Heartbeat = signal(),
}

function RunService:IsRunning()
	return true
end

function RunService:IsServer()
	return true
end

local team_list = {}

local Teams = {}

function Teams:GetChildren()
	return table.clone(team_list)
end

function Teams:FindFirstChild(name)
	for _, team in team_list do
		if team.Name == name then
			return team
		end
	end
	return nil
end

services.Players = Players
services.RunService = RunService
services.Teams = Teams

local next_user_id = 1

-- adds a player to the game, firing PlayerAdded
local function add_player(name: string)
	local player = {
		Name = name,
		UserId = next_user_id,
		Parent = Players,
	}
	next_user_id += 1

	table.insert(player_list, player)
	Players.PlayerAdded:Fire(player)
	return player :: any
end

-- removes a player from the game, firing PlayerRemoving first like roblox does
local function remove_player(player)
	Players.PlayerRemoving:Fire(player)
	table.remove(player_list, table.find(player_list, player))
	player.Parent = nil
end

local function add_team(name: string)
	local team = {
		Name = name,
		ClassName = "Team",
	}
	table.insert(team_list, team)
	return team :: any
end

return {
	add_player = add_player,
	remove_player = remove_player,
	add_team = add_team,
}
