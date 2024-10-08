import { Signal } from "@rbxts/beacon";
import { SharedConfig } from "../types";
import { ReadonlyDeep } from "../util/data";
import { CenturionLogLevel, CenturionLogger } from "../util/log";
import { getInputText } from "../util/string";
import { CommandContext } from "./context";
import { RegistryPath } from "./path";
import { BaseRegistry } from "./registry";

export abstract class BaseDispatcher<
	C extends ReadonlyDeep<SharedConfig> = ReadonlyDeep<SharedConfig>,
	R extends BaseRegistry<C> = BaseRegistry<C>,
> {
	protected logger: CenturionLogger;
	readonly commandExecuted = new Signal<[context: CommandContext]>();

	constructor(
		protected readonly config: C,
		protected readonly registry: R,
	) {
		this.logger = new CenturionLogger(config.logLevel, "Dispatcher");
	}

	protected async executeCommand(
		executor: Player,
		path: RegistryPath,
		inputText: string,
		args: string[] = [],
	) {
		const command = this.registry.getCommand(path);
		const context = new CommandContext(executor, path, args, inputText);
		context.state = this.config.defaultContextState;

		if (command === undefined) {
			context.error(this.config.messages.notFound);
			return context;
		}

		if (this.logger.level === CenturionLogLevel.Debug) {
			this.logger.debug(
				`Player '${executor.Name}' executed command: ${getInputText(path, args)}`,
			);
		}

		command.execute(context, args);
		this.commandExecuted.Fire(context);
		if (!context.isReplyReceived() && !command.options.disableDefaultReply) {
			context.reply(this.config.messages.default);
		}
		return context;
	}
}
