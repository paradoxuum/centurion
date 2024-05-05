import { CommandContext } from "./context";
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
		const context = new CommandContext(path, text, executor);

		if (command === undefined) {
			context.error("Command not found.");
			return context;
		}

		command.execute(context, text);
		if (!context.isReplyReceived()) {
			context.reply(DEFAULT_REPLY_TEXT);
		}

		return context;
	}
}
