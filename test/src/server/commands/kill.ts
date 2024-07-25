import {
	CenturionType,
	Command,
	CommandContext,
	Register,
} from "@rbxts/centurion";
import { Players } from "@rbxts/services";

@Register()
export class KillCommand {
	@Command({
		name: "kill",
		description: "Kill players",
		arguments: [
			{
				name: "players",
				description: "Players to kill",
				type: CenturionType.Players,
				optional: true,
			},
		],
		shortcuts: [[Enum.KeyCode.F4]],
	})
	kill(ctx: CommandContext, players?: Player[]) {
		const playersArray = players ?? Players.GetPlayers();

		for (const player of playersArray) {
			this.killPlayer(player);
		}

		ctx.reply(`Successfully killed ${playersArray.size()} player(s)`);
	}

	private killPlayer(player: Player) {
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (humanoid === undefined) {
			return;
		}

		humanoid.Health = 0;
	}
}
