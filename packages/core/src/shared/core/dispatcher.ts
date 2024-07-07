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
		inputText: string,
		args: string[] = [],
		executor?: Player,
	) {
		const command = this.registry.getCommand(path);
		const context = new CommandContext(path, args, inputText, executor);
		context.state = this.defaultContextState;

		if (command === undefined) {
			context.error("Command not found.");
			return context;
		}

		command.execute(context, args);
		if (!context.isReplyReceived()) {
			context.reply(DEFAULT_REPLY_TEXT);
		}
		return context;
	}
}
