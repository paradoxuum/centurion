local UserInputService = game:GetService("UserInputService")

-- name of a gamepad button for the connected controller, e.g. "A" on Xbox
-- and "Cross" on PlayStation
local function button_name(key: Enum.KeyCode): string
	local name = UserInputService:GetStringForKeyCode(key)
	if name == "" then
		name = key.Name
	end
	return (name:gsub("^Button", ""))
end

return button_name
