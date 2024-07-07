import {
	Centurion,
	CenturionType,
	Command,
	CommandContext,
} from "@rbxts/centurion";
import { CenturionUI, DefaultPalette } from "@rbxts/centurion-ui";

@Centurion
export class ThemeCommand {
	@Command({
		name: "theme",
		description: "Change the interface's palette",
		arguments: [
			{
				name: "name",
				description: "The name of the palette to set",
				type: CenturionType.String,
				suggestions: ["mocha", "macchiato", "frappe", "latte"],
			},
		],
		aliases: ["palette"],
	})
	theme(ctx: CommandContext, theme: string) {
		if (!(theme in DefaultPalette)) {
			ctx.error("Invalid theme");
			return;
		}

		CenturionUI.updateOptions({
			palette: DefaultPalette[theme as never],
		});
		ctx.reply(`Set theme to '${theme}'`);
	}
}
