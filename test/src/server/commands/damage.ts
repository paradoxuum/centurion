import {
	Command,
	CommandContext,
	Commander,
	CommanderType,
} from "@rbxts/commander";

@Commander()
class DamageCommand {
	@Command({
		name: "damage",
		description: "Damages a player",
		arguments: [
			{
				name: "player",
				description: "Player to damage",
				type: CommanderType.Player,
			},
			{
				name: "damage",
				description: "Amount to damage player",
				type: CommanderType.Number,
			},
		],
	})
	damage(ctx: CommandContext, player: Player, damage: number) {
		if (player.Character === undefined) {
			ctx.error("Player's character does not exist");
			return;
		}

		const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
		if (humanoid === undefined) {
			ctx.error("Player's humanoid does not exist");
			return;
		}

		if (humanoid.Health === 0) {
			ctx.error("Player is already dead");
			return;
		}

		humanoid.Health -= damage;
		ctx.reply(`Damaged <b>${player.DisplayName}</b> for <b>${damage}</b> HP`);
	}
}
