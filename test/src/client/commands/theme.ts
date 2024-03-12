import { CommanderInterface, DefaultPalette } from "..";
import { Command, CommandInteraction, CommanderType } from "../../shared";

export class ThemeCommand {
	@Command({
		name: "theme",
		description: "Change the interface's palette",
		arguments: [
			{
				name: "name",
				description: "The name of the palette to set",
				type: CommanderType.String,
			},
		],
	})
	theme(interaction: CommandInteraction, theme: string) {
		if (!(theme in DefaultPalette)) {
			interaction.error("Invalid theme");
			return;
		}

		CommanderInterface.setOptions({
			palette: DefaultPalette[theme as never],
		});
		interaction.reply(`Set theme to '${theme}'`);
	}
}
