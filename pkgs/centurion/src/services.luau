-- outside of roblox (unit tests) `game` doesn't exist and every service is nil
-- until a test assigns a fake to it.
export type Services = {
	Players: Players,
	RunService: RunService,
	Teams: Teams,
}

local services: Services = {} :: any

if game then
	services.Players = game:GetService("Players")
	services.RunService = game:GetService("RunService")
	services.Teams = game:GetService("Teams")
end

return services
