import { splitStringBySpace } from "../util/string";
import { CommandInteraction } from "./interaction";
import { CommandPath } from "./path";
import { BaseRegistry } from "./registry";

const DEFAULT_REPLY_TEXT = "Command executed.";
const ERROR_TEXT = "An error occurred.";

export abstract class BaseDispatcher {
	constructor(private readonly registry: BaseRegistry) {}

	protected async executeCommand(path: CommandPath, executor: Player, text: string) {
		const command = this.registry.getCommand(path);
		assert(command !== undefined, `Command '${path}' is not registered`);
		const args = splitStringBySpace(text);

		return Promise.try(() => {
			const interaction = new CommandInteraction(executor, text);
			command.execute(interaction, args);

			if (!interaction.isReplyReceived()) {
				interaction.reply(DEFAULT_REPLY_TEXT);
			}

			return interaction;
		}).catch(() => {
			const interaction = new CommandInteraction(executor, text);
			interaction.error(ERROR_TEXT);
			return interaction;
		});
	}
}
