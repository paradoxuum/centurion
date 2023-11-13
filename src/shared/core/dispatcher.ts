import { Players } from "@rbxts/services";
import { CommandInteraction } from "./interaction";
import { CommandPath } from "./path";
import { BaseRegistry } from "./registry";

export abstract class BaseDispatcher {
	constructor(private readonly registry: BaseRegistry) {}

	protected executeCommand(path: CommandPath, executor: Player, text: string) {
		const command = this.registry.getCommand(path);
		assert(command !== undefined, `Command '${path}' is not registered`);
		const args = text.split(" ");

		let interaction = new CommandInteraction(Players.LocalPlayer, text);
		try {
			command.execute(interaction, args);
		} catch (err) {
			warn(`An error occurred while executing ${path}: ${err}`);

			// The interaction may have already been replied to, so overwrite it and
			// indicate that an error occurred
			interaction = new CommandInteraction(Players.LocalPlayer, text);
			interaction.error("An error occurred.");
		}
		return interaction;
	}
}
