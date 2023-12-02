import {
	BuiltInTypes,
	Command,
	CommandInteraction,
	Commander,
	Group,
} from "@rbxts/commander";

@Commander({
	groups: [
		{
			name: "info",
			description: "View info about a user or the server",
		},
		{
			name: "user",
			description: "View info about a user",
			root: "info",
		},
		{
			name: "server",
			description: "View info about the server",
			root: "info",
		},
	],
	globalGroups: ["info"],
})
class InfoCommand {
	@Command({
		name: "view",
		description: "Views information about a user",
		arguments: [
			{
				name: "player",
				description: "Player to view information for",
				type: BuiltInTypes.Player,
			},
		],
	})
	@Group("user")
	userView(interaction: CommandInteraction, player: Player) {
		interaction.reply(`<Random data about ${player.Name} here>`);
	}

	@Command({
		name: "view",
		description: "Views information about the server",
	})
	@Group("server")
	serverView(interaction: CommandInteraction) {
		interaction.reply("<Random data about the server here>");
	}
}
