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

		const interaction = new CommandInteraction(Players.LocalPlayer, text);
		command.execute(interaction, args);
	}
}
