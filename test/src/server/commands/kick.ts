import {
	CenturionType,
	Command,
	CommandContext,
	Register,
} from "@rbxts/centurion";

@Register()
export class KickCommand {
	@Command({
		name: "kick",
		description: "Kicks a player",
		arguments: [
			{
				name: "player",
				description: "Player to kick",
				type: CenturionType.Player,
			},
			{
				name: "reason",
				description: "Reason for kicking the player",
				type: CenturionType.String,
				numArgs: "rest",
			},
		],
	})
	kick(_: CommandContext, player: Player, reason: string[]) {
		const reasonText = reason.join(" ");
		print(`Kicked ${player.Name} for ${reasonText}`);
	}
}
