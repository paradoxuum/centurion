import {
	Centurion,
	CenturionType,
	Command,
	CommandContext,
	Group,
	Register,
} from "@rbxts/centurion";
import { addAdmin, removeAdmin } from "../permissions";

@Register({
	groups: [
		{
			name: "admin",
			description: "Commands for managing admins",
		},
	],
})
@Group("admin")
export class AdminCommand {
	@Command({
		name: "add",
		description: "Add an admin",
		arguments: [
			{
				name: "player",
				description: "The player to add",
				type: CenturionType.Player,
			},
		],
	})
	add(ctx: CommandContext, player: Player) {
		addAdmin(player);
		Centurion.server().registry.sync(player);
		ctx.reply(`Gave admin permisisons to ${player.Name}`);
	}

	@Command({
		name: "remove",
		description: "Remove an admin",
		arguments: [
			{
				name: "player",
				description: "The player to remove",
				type: CenturionType.Player,
			},
		],
	})
	remove(ctx: CommandContext, player: Player) {
		removeAdmin(player);
		Centurion.server().registry.sync(player);
		ctx.reply(`Removed admin permissions from ${player.Name}`);
	}
}
