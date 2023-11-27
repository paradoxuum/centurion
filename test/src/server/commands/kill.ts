import { Command, CommandInteraction, Commander } from "@rbxts/commander";

@Commander()
class InfoCommand {
	@Command({
		name: "kill",
		arguments: [
			{
				name: "player",
				description: "Player to kill",
				type: "player",
			},
		],
	})
	kill(interaction: CommandInteraction, player: Player) {
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (humanoid === undefined) {
			interaction.error(`${player.Name} does not have a Humanoid`);
			return;
		}

		humanoid.Health = 0;
		interaction.reply(`Successfully killed ${player.Name}`);
	}
}
