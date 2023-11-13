import { Players } from "@rbxts/services";
import { CommandInteraction } from "./interaction";
import { CommandPath } from "./path";
import { BaseRegistry } from "./registry";

export abstract class BaseDispatcher {
	constructor(private readonly registry: BaseRegistry) {}

	protected async executeCommand(path: CommandPath, executor: Player, text: string) {
		const command = this.registry.getCommand(path);
		assert(command !== undefined, `Command '${path}' is not registered`);
		const args = text.split(" ");

		return Promise.try(() => {
			const interaction = new CommandInteraction(Players.LocalPlayer, text);
			command.execute(interaction, args);
			return interaction;
		}).catch((err) => {
			warn(`An error occurred while executing ${path}: ${err}`);

			const interaction = new CommandInteraction(Players.LocalPlayer, text);
			interaction.error("An error occurred.");
			return interaction;
		});
	}
}
