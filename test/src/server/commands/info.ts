import {
	CenturionType,
	Command,
	CommandContext,
	Group,
	Register,
} from "@rbxts/centurion";

@Register({
	groups: [
		{
			name: "info",
			description: "View info about a user or the server",
		},
		{
			name: "user",
			description: "View info about a user",
			parent: ["info"],
		},
		{
			name: "server",
			description: "View info about the server",
			parent: ["info"],
		},
	],
})
@Group("info")
export class InfoCommand {
	@Command({
		name: "view",
		description: "Views information about a user",
		arguments: [
			{
				name: "player",
				description: "Player to view information for",
				type: CenturionType.Player,
			},
		],
	})
	@Group("user")
	userView(ctx: CommandContext, player: Player) {
		ctx.reply(`(Random data about ${player.Name} here)`);
	}

	@Command({
		name: "view",
		description: "Views information about the server",
	})
	@Group("server")
	serverView(ctx: CommandContext) {
		ctx.reply("(Random data about the server here)");
	}
}
