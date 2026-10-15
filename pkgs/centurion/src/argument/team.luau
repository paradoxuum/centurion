local argument = require("./.")
local result = require("../result")
local services = require("../services")
local types = require("../types")

local team = argument.register_type("team", {
	transform = function(value: string, _executor: Player): types.Result<Team>
		local team_obj = services.Teams:FindFirstChild(value)
		if team_obj == nil or team_obj.ClassName ~= "Team" then
			return result.error(`Team '{value}' not found.`)
		end
		return result.success(team_obj :: Team)
	end,
	suggestions = function(_value: string, _executor: Player): { string }
		local suggestions: { string } = {}
		for _, team_obj in pairs(services.Teams:GetChildren()) do
			if team_obj.ClassName ~= "Team" then
				continue
			end
			table.insert(suggestions, team_obj.Name)
		end
		return suggestions
	end,
})

return team
