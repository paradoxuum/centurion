local Teams = game:GetService("Teams")

local argument = require("./.")
local result = require("../result")
local types = require("../types")

local team = argument.register("team", {
	transform = function(value: string, _executor: Player): types.Result
		local team_obj = Teams:FindFirstChild(value)
		if team_obj == nil or team_obj.ClassName ~= "Team" then
			return result.error(`Team '{value}' not found.`)
		end
		return result.success(team_obj)
	end,
	suggestions = function(_value: string, _executor: Player): { string }
		local suggestions: { string } = {}
		for _, team_obj in pairs(Teams:GetChildren()) do
			if team_obj.ClassName ~= "Team" then
				continue
			end
			table.insert(suggestions, team_obj.Name)
		end
		return suggestions
	end,
})

return team :: types.ArgumentFn<Team>
