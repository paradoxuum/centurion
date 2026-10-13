local UserInputService = game:GetService("UserInputService")

local vide = require("../vide")

local cleanup = vide.cleanup
local source = vide.source

local function preferred_input(): () -> Enum.PreferredInput
	local preferred = source(UserInputService.PreferredInput)
	cleanup(UserInputService:GetPropertyChangedSignal("PreferredInput"):Connect(function()
		preferred(UserInputService.PreferredInput)
	end))
	return preferred
end

return preferred_input
