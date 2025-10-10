local centurion = require("../pkgs/centurion/src")

centurion.sync.setup()

-- TEST NETWORKING:
-- local network = require("@self/network")
-- local syncer = centurion.sync.server(true)
-- network.RequestState.SetCallback(function(player)
-- 	syncer.hydrate(player)
-- end)

-- syncer.connect(function(player, payload)
-- 	network.SyncState.Fire(player, payload :: any)
-- end)

-- network.Execute.SetCallback(function(executor, command, args)
-- 	return centurion.command.execute(executor, command, args)
-- end)

-- centurion.arg.register("type", centurion.arg.enum({ "number" }))

centurion.guard.register("test", function()
	return true
end)

centurion.command.register("test", {
	description = "A test command",
	arguments = function()
		return centurion.types.string("arg1", "The first argument")
	end,
	guards = { "test" },
	callback = function(ctx, arg)
		print(ctx, arg)
	end,
})
