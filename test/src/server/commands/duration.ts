import {
	CenturionType,
	Command,
	CommandContext,
	Register,
} from "@rbxts/centurion";

@Register()
export class DurationCommand {
	@Command({
		name: "duration",
		description: "Prints the duration in seconds",
		arguments: [
			{
				name: "duration",
				description: "The duration to print",
				type: CenturionType.Duration,
			},
		],
	})
	duration(ctx: CommandContext, duration: number) {
		ctx.reply(`${duration} second(s)`);
	}
}
