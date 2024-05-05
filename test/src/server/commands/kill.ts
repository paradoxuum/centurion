import {
	Command,
	CommandContext,
	Commander,
	CommanderType,
} from "@rbxts/commander";

@Commander()
class KillCommand {
	@Command({
		name: "kill",
		description: "Kill players",
		arguments: [
			{
				name: "players",
				description: "Players to kill",
				type: CommanderType.Players,
			},
		],
	})
	kill(ctx: CommandContext, players: Player[]) {
		for (const player of players) {
			this.killPlayer(player);
		}

		ctx.reply(`Successfully killed ${players.size()} player(s)`);
	}

	private killPlayer(player: Player) {
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (humanoid === undefined) {
			return;
		}

		humanoid.Health = 0;
	}
}
