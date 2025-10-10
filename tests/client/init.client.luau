local centurion = require("../pkgs/centurion/src")
local centurion_ui = require("../pkgs/centurion-ui/src")
-- local network = require("@self/network")

centurion.sync.setup()

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
