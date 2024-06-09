import {
	Command,
	CommandContext,
	Commander,
	CommanderType,
} from "@rbxts/commander";
import { Players } from "@rbxts/services";

@Commander
class KillCommand {
	@Command({
		name: "kill",
		description: "Kill players",
		arguments: [
			{
				name: "players",
				description: "Players to kill",
				type: CommanderType.Players,
				optional: true
			},
		],
		shortcuts: [[Enum.KeyCode.F4]]
	})
	kill(ctx: CommandContext, players?: Player[]) {
		players = players ?? Players.GetPlayers();

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
