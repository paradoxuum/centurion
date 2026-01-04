--!nonstrict
local centurion = require("../pkgs/centurion/src")

centurion.setup_networking()

centurion.create_role("user", 1, { "echo" })
centurion.create_role("moderator", 50, { "kick" })
centurion.create_role("admin", 100)

centurion.register_command("to", {
	description = "Teleport to a position",
	arguments = function()
		return centurion.args.vector("position")
	end,
	callback = function(ctx: centurion.Context, pos: vector)
		ctx.executor.Character:PivotTo(CFrame.new(pos))
		ctx.reply(`Teleported to ({pos.x}, {pos.y}, {pos.z})`)
	end,
})

centurion.register_command("echo", {
	description = "Prints a message to the terminal",
	permissions = { "echo" },
	arguments = function()
		return centurion.args.string("message", "The message to echo back")
	end,
	callback = function(ctx: centurion.Context, message: string)
		ctx.reply("Echo: " .. message)
	end,
})

centurion.register_command("kill", {
	description = "Kill player(s)",
	arguments = function()
		return centurion.args.players("target", "The players to kill")
	end,
	callback = function(ctx: centurion.Context, targets: { Player })
		for _, target in targets do
			local character = target.Character
			if character then
				local humanoid = character:FindFirstChildOfClass("Humanoid")
				if humanoid then
					humanoid.Health = 0
				end
			end
		end
		ctx.reply("Killed " .. #targets .. " player(s).")
	end,
})

centurion.register_command("kick", {
	description = "Kick a player from the server",
	permissions = { "kick" },
	arguments = function()
		return centurion.args.player("target", "The player to kick"),
			centurion.optional(centurion.args.string("reason", "The reason for the kick"))
	end,
	callback = function(ctx: centurion.Context, target: Player, reason: string?)
		target:Kick(reason or "No reason provided")
		ctx.reply("Kicked " .. target.Name)
	end,
})

centurion.register_command("roles get", {
	description = "Get a player's roles",
	arguments = function()
		return centurion.args.player("player", "The player to get roles for")
	end,
	callback = function(ctx: centurion.Context, player: Player)
		local roles = centurion.get_roles(player)
		ctx.reply(player.Name .. ": " .. table.concat(roles, ", "))
	end,
})

centurion.register_command("roles add", {
	description = "Add a role to a player",
	arguments = function()
		return centurion.args.player("player", "The player to add a role to"),
			centurion.num_args(centurion.args.string("role", "The role to add"), "rest")
	end,
	callback = function(ctx: centurion.Context, player: Player, ...: string)
		centurion.add_roles(player, unpack(...))
		ctx.reply("Added roles " .. table.concat(..., ",") .. " to " .. player.Name)
	end,
})

centurion.register_command("roles remove", {
	description = "Remove a role from a player",
	arguments = function()
		return centurion.args.player("player", "The player to remove a role from"),
			centurion.num_args(centurion.args.string("role", "The role to remove"), "rest")
	end,
	callback = function(ctx: centurion.Context, player: Player, ...: string)
		centurion.remove_roles(player, unpack(...))
		ctx.reply("Removed roles " .. table.concat(..., ",") .. " from " .. player.Name)
	end,
})
