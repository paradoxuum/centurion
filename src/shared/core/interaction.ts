import { CommandInteractionData, CommandReply } from "../types";
import { RegistryPath } from "./path";

/**
 * A data structure containing the executor of a command, the
 * text used to execute it and the reply sent to the executor,
 * if one was given.
 */
export class CommandInteraction {
	private replyData?: Readonly<CommandReply>;

	constructor(
		readonly path: RegistryPath,
		readonly text: string,
		readonly executor?: Player,
	) {}

	/**
	 * Gets the command interaction's data.
	 *
	 * This creates a new {@link CommandInteractionData} each time it is called.
	 *
	 * @returns The interaction's data
	 */
	getData(): CommandInteractionData {
		return {
			executor: this.executor,
			text: this.text,
			reply: this.replyData,
		};
	}

	/**
	 * Replies to the interaction.
	 *
	 * @param text The reply text
	 */
	reply(text: string) {
		this.setReply(this.createReply(text, true));
	}

	/**
	 * Replies to the interaction, indicating an error has occurred.
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
		assert(
			this.replyData === undefined,
			"This CommandInteraction has already received a reply",
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
