import { SharedOptions } from "../options";
import { CommandContext } from "./context";
import { RegistryPath } from "./path";
import { BaseRegistry } from "./registry";

const DEFAULT_REPLY_TEXT = "Command executed.";

export abstract class BaseDispatcher {
	protected defaultContextState?: defined;

	constructor(private readonly registry: BaseRegistry) {}

	init(options: SharedOptions) {
		this.defaultContextState = options.defaultContextState;
	}

	protected async executeCommand(
		path: RegistryPath,
		executor: Player,
		text: string,
	) {
		const command = this.registry.getCommand(path);
		const context = new CommandContext(path, text, executor);
		context.state = this.defaultContextState;

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
