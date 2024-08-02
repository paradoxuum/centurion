import {
	CenturionType,
	Command,
	CommandContext,
	Register,
} from "@rbxts/centurion";

@Register()
export class TeleportCommand {
	@Command({
		name: "teleport",
		description: "Teleports to a position",
		arguments: [
			{
				name: "position",
				description: "Coordinates to teleport to",
				type: CenturionType.Number,
				numArgs: 3,
			},
		],
	})
	teleport(ctx: CommandContext, coords: number[]) {
		const pos = new Vector3(coords[0], coords[1], coords[2]);
		ctx.executor.Character?.PivotTo(new CFrame(pos));
		ctx.reply(`Teleported to ${pos}`);
	}
}
