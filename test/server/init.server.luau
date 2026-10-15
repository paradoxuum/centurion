--!strict
local centurion = require("../pkgs/centurion/src")

centurion.setup_networking()

centurion.create_role("user", 1, { "echo" })
centurion.create_role("moderator", 50, { "kick" })
centurion.create_role("admin", 100)

centurion
	.command("to", {
		description = "Teleport to a position",
		arguments = function()
			return centurion.args.vector3("position")
		end,
	})
	:callback(function(ctx, pos)
		local character = ctx.executor.Character
		if not character then
			return
		end

		character:PivotTo(CFrame.new(Vector3.new(pos.x, pos.y, pos.z)))
		ctx.reply(`Teleported to ({pos.x}, {pos.y}, {pos.z})`)
	end)

centurion
	.command("tp", {
		description = "Teleport a player to a position",
		arguments = function()
			return centurion.args.player("target"), centurion.args.vector3("position")
		end,
	})
	:callback(function(ctx, target, pos)
		local character = target.Character
		if character then
			character:PivotTo(CFrame.new(Vector3.new(pos.x, pos.y, pos.z)))
			ctx.reply(`Teleported {target.Name} to ({pos.x}, {pos.y}, {pos.z})`)
		end
	end)

centurion
	.command("rgb", {
		description = "Change the color of your character",
		arguments = function()
			return centurion.args.rgb_color("color")
		end,
	})
	:callback(function(ctx, color)
		local character = ctx.executor.Character
		if character then
			for _, part in character:GetChildren() do
				if part:IsA("BasePart") then
					part.Color = color
				end
			end
			ctx.reply(`Changed color to RGB({color.R * 255}, {color.G * 255}, {color.B * 255})`)
		else
			ctx.reply("Character not found.")
		end
	end)

centurion
	.command("echo", {
		description = "Prints a message to the terminal",
		permissions = { "echo" },
		arguments = function()
			return centurion.args.string("message", "The message to echo back")
		end,
	})
	:callback(function(ctx, message)
		ctx.reply("Echo: " .. message)
	end)

centurion
	.command("kill", {
		description = "Kill player(s)",
		arguments = function()
			return centurion.args.players("target", "The players to kill")
		end,
	})
	:callback(function(ctx, targets)
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
	end)

centurion
	.command("kick", {
		description = "Kick a player from the server",
		permissions = { "kick" },
		arguments = function()
			return centurion.args.player("target", "The player to kick"),
				centurion.optional(centurion.args.string("reason", "The reason for the kick"))
		end,
	})
	:callback(function(ctx, target, reason)
		target:Kick(reason or "No reason provided")
		ctx.reply("Kicked " .. target.Name)
	end)

centurion
	.command("roles get", {
		description = "Get a player's roles",
		arguments = function()
			return centurion.args.player("player", "The player to get roles for")
		end,
	})
	:callback(function(ctx, player)
		local roles = centurion.get_roles(player)
		ctx.reply(player.Name .. ": " .. table.concat(roles, ", "))
	end)

centurion
	.command("roles add", {
		description = "Add a role to a player",
		arguments = function()
			return centurion.args.player("player", "The player to add a role to"),
				centurion.rest(centurion.args.string("role", "The role to add"))
		end,
	})
	:callback(function(ctx, player, roles)
		centurion.add_roles(player, unpack(roles))
		ctx.reply("Added roles " .. table.concat(roles, ",") .. " to " .. player.Name)
	end)

centurion
	.command("roles remove", {
		description = "Remove a role from a player",
		arguments = function()
			return centurion.args.player("player", "The player to remove a role from"),
				centurion.rest(centurion.args.string("role", "The role to remove"))
		end,
	})
	:callback(function(ctx, player, roles)
		centurion.remove_roles(player, unpack(roles))
		ctx.reply("Removed roles " .. table.concat(roles, ",") .. " from " .. player.Name)
	end)
