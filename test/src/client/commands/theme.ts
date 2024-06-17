import {
	Command,
	CommandContext,
	CommanderInterface,
	CommanderType,
	DefaultPalette,
} from "@rbxts/commander";

export class ThemeCommand {
	@Command({
		name: "theme",
		description: "Change the interface's palette",
		arguments: [
			{
				name: "name",
				description: "The name of the palette to set",
				type: CommanderType.String,
				suggestions: ["mocha", "macchiato", "frappe", "latte"],
			},
		],
	})
	theme(ctx: CommandContext, theme: string) {
		if (!(theme in DefaultPalette)) {
			ctx.error("Invalid theme");
			return;
		}

		CommanderInterface.updateOptions({
			palette: DefaultPalette[theme as never],
		});
		ctx.reply(`Set theme to '${theme}'`);
	}
}
