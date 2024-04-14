import { CommandInteraction } from "./interaction";
import { RegistryPath } from "./path";
import { BaseRegistry } from "./registry";

const DEFAULT_REPLY_TEXT = "Command executed.";

export abstract class BaseDispatcher {
	constructor(private readonly registry: BaseRegistry) {}

	protected async executeCommand(
		path: RegistryPath,
		executor: Player,
		text: string,
	) {
		const command = this.registry.getCommand(path);
		const interaction = new CommandInteraction(path, executor, text);

		if (command === undefined) {
			interaction.error("Command not found.");
			return interaction;
		}

		command.execute(interaction, text);
		if (!interaction.isReplyReceived()) {
			interaction.reply(DEFAULT_REPLY_TEXT);
		}

		return interaction;
	}
}
