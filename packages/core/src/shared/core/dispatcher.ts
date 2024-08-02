import { SharedConfig } from "../types";
import { ReadonlyDeep } from "../util/data";
import { CenturionLogLevel, CenturionLogger } from "../util/log";
import { getInputText } from "../util/string";
import { CommandContext } from "./context";
import { RegistryPath } from "./path";
import { BaseRegistry } from "./registry";

const DEFAULT_REPLY_TEXT = "Command executed.";

export abstract class BaseDispatcher<
	C extends ReadonlyDeep<SharedConfig> = ReadonlyDeep<SharedConfig>,
> {
	protected logger: CenturionLogger;

	constructor(
		protected readonly config: C,
		protected readonly registry: BaseRegistry<C>,
	) {
		this.logger = new CenturionLogger(config.logLevel, "Dispatcher");
	}

	protected async executeCommand(
		executor: Player,
		path: RegistryPath,
		inputText: string,
		args: string[] = [],
	) {
		if (this.logger.level === CenturionLogLevel.Debug) {
			this.logger.debug(
				`Executing command with executor '${executor.Name}': ${getInputText(path, args)}`,
			);
		}

		const command = this.registry.getCommand(path);
		const context = new CommandContext(
			this.logger,
			executor,
			path,
			args,
			inputText,
		);
		context.state = this.config.defaultContextState;

		if (command === undefined) {
			context.error("Command not found.");
			return context;
		}

		command.execute(context, args);
		if (!context.isReplyReceived() && !command.options.disableDefaultReply) {
			context.reply(DEFAULT_REPLY_TEXT);
		}
		return context;
	}
}
