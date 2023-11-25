import { BuiltInTypes, Cmdx, Command, CommandInteraction } from "@rbxts/cmdx";

@Cmdx()
class DamageCommand {
	@Command({
		name: "damage",
		description: "Damages a player",
		arguments: [
			{
				name: "player",
				description: "Player to damage",
				type: BuiltInTypes.Player,
			},
			{
				name: "damage",
				description: "Amount to damage player",
				type: BuiltInTypes.Number,
			},
		],
	})
	damage(interaction: CommandInteraction, player: Player, damage: number) {
		if (player.Character === undefined) {
			interaction.error("Player's character does not exist");
			return;
		}

		const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
		if (humanoid === undefined) {
			interaction.error("Player's humanoid does not exist");
			return;
		}

		if (humanoid.Health === 0) {
			interaction.error("Player is already dead");
			return;
		}

		humanoid.Health -= damage;
		interaction.reply(`Damaged <b>${player.DisplayName}</b> for <b>${damage}</b> HP`);
	}
}
