local centurion = require("../pkgs/centurion/src")
local network = require("@self/network")

local syncer = centurion.sync.server(true)

network.RequestState.SetCallback(function(player)
	syncer.hydrate(player)
end)

syncer.connect(function(player, payload)
	network.SyncState.Fire(player, payload :: any)
end)

centurion.arg.register("type", centurion.arg.enum({ "number" }))

centurion.builtin.register_types()
centurion.guard.register("test", function()
	return true
end)

centurion.command.register("test", {
	description = "A test command",
	arguments = {
		{
			name = "type",
			type = "number",
		},
	},
	guards = { "test" },
	callback = function(ctx)
		print(ctx)
	end,
})

network.Execute.SetCallback(function(executor, command, args)
	return centurion.command.execute(executor, command, args)
end)
