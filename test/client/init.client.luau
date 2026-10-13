local centurion = require("../pkgs/centurion/src")
local centurion_ui = require("../pkgs/centurion-ui/src")
-- local network = require("@self/network")

centurion.setup_networking()

-- local syncer = centurion.sync.client()
-- centurion.command.set_network_handler(function(command, args)
-- 	local result = network.Execute.Call(command, args) :: centurion.Context
-- 	print(result)
-- 	return result
-- end)

-- network.SyncState.SetCallback(function(...)
-- 	syncer.sync(...)
-- 	centurion.command.execute(Players.LocalPlayer, "test", { "1" })
-- end)

-- network.RequestState.Fire()

centurion_ui.mount({ Enum.KeyCode.F2 })
centurion_ui.configure({})
centurion_ui.register_commands()

local mobile_gui = Instance.new("ScreenGui")
mobile_gui.Parent = game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui")
mobile_gui.Name = "MobileGui"

local open_terminal_btn = Instance.new("TextButton")
open_terminal_btn.Parent = mobile_gui
open_terminal_btn.AnchorPoint = Vector2.new(0, 1)
open_terminal_btn.Size = UDim2.new(0, 200, 0, 50)
open_terminal_btn.Position = UDim2.new(0, 10, 1, -10)
open_terminal_btn.Text = "Open Terminal"
open_terminal_btn.BackgroundColor3 = Color3.fromRGB(0, 170, 255)
open_terminal_btn.TextColor3 = Color3.fromRGB(255, 255, 255)
open_terminal_btn.Font = Enum.Font.SourceSans
open_terminal_btn.TextSize = 24

open_terminal_btn.MouseButton1Click:Connect(function()
	centurion_ui.open()
end)
