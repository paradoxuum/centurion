import { CommanderInterface, DefaultPalette } from "..";
import { Command, CommandInteraction, CommanderType } from "../../shared";

export class ThemeCommand {
	@Command({
		name: "theme",
		arguments: [
			{
				name: "theme",
				description: "The theme to set",
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
