local Players = game:GetService("Players")

local centurion = require("../pkgs/centurion/src")
local centurion_ui = require("../pkgs/centurion-ui/src")
local network = require("@self/network")

local syncer = centurion.sync.client()

-- local sync_remote = ReplicatedStorage:WaitForChild("CenturionSync") :: RemoteEvent
-- sync_remote:FireServer()

-- local execute_remote = ReplicatedStorage:WaitForChild("CenturionExecute") :: RemoteFunction

centurion.command.set_network_handler(function(command, args)
	local result = network.Execute.Call(command, args) :: centurion.Context
	print(result)
	return result
end)

network.SyncState.SetCallback(function(...)
	syncer.sync(...)
	centurion.command.execute(Players.LocalPlayer, "test", { "1" })
end)

network.RequestState.Fire()

centurion_ui.mount({ Enum.KeyCode.F2 })
