import {
	Command,
	CommandInteraction,
	Commander,
	CommanderType,
} from "@rbxts/commander";

@Commander({
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
				type: CommanderType.Player,
			},
		],
	})
	userView(interaction: CommandInteraction, player: Player) {
		interaction.reply(`<Random data about ${player.Name} here>`);
	}

	// @Command({
	// 	name: "view",
	// 	description: "Views information about the server",
	// })
	// @Group("server")
	// serverView(interaction: CommandInteraction) {
	// 	interaction.reply("<Random data about the server here>");
	// }
}
