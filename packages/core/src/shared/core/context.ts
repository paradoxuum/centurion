import { CommandContextData, CommandReply } from "../types";
import { CenturionLogger } from "../util/log";
import { RegistryPath } from "./path";

/**
 * A data structure containing the context of an executed command.
 */
export class CommandContext<S = unknown> {
	private replyData?: Readonly<CommandReply>;
	state: S;

	constructor(
		private readonly logger: CenturionLogger,
		readonly executor: Player,
		readonly path: RegistryPath,
		readonly args: string[],
		readonly input: string,
	) {}

	/**
	 * Gets the command context's data.
	 *
	 * This creates a new {@link CommandContextData} each time it is called.
	 *
	 * @returns The command context's data
	 */
	getData(): CommandContextData {
		return {
			args: this.args,
			input: this.input,
			executor: this.executor,
			reply: this.replyData,
		};
	}

	/**
	 * Sets the reply for this {@link CommandContext}.
	 *
	 * @param text The reply text
	 */
	reply(text: string) {
		this.setReply(this.createReply(text, true));
	}

	/**
	 * Sets the reply for this {@link CommandContext}, indicating an error has occurred.
	 *
	 * @param text The reply text
	 */
	error(text: string) {
		this.setReply(this.createReply(text, false));
	}

	/**
	 * Sets the reply data.
	 *
	 * @param reply The reply data
	 * @throws Will throw if a reply has already been set
	 */
	setReply(reply: CommandReply) {
		this.logger.assert(
			this.replyData === undefined,
			"This CommandContext has already received a reply",
		);
		this.replyData = table.freeze(table.clone(reply));
	}

	/**
	 * Gets the reply data.
	 *
	 * @returns The reply data
	 */
	getReply() {
		return this.replyData;
	}

	/**
	 * Checks whether a reply has been received.
	 *
	 * @returns `true` if a reply has been received, `false` if not
	 */
	isReplyReceived() {
		return this.replyData !== undefined;
	}

	private createReply(text: string, success: boolean): CommandReply {
		return {
			success,
			text,
			sentAt: os.time(),
		};
	}
}
