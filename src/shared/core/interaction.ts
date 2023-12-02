import { CommandInteractionData, CommandReply } from "../types";

/**
 * A data structure containing the executor of a command, the
 * text used to execute it and the reply sent to the executor,
 * if one was given.
 */
export class CommandInteraction {
	private onReplySignal = new Instance("BindableEvent");
	private replyData?: CommandReply;

	constructor(readonly executor: Player, readonly text: string) {}

	/**
	 * Gets the command interaction's data.
	 *
	 * This creates a new {@link CommandInteractionData} each time it is called.
	 *
	 * @returns the interaction's data
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
	 * @param text the reply text
	 */
	reply(text: string) {
		this.setReply(text, true);
	}

	/**
	 * Replies to the interaction using {@link CommandInteractionData}.
	 *
	 * @param data the interaction data
	 */
	replyFromData(data: CommandInteractionData) {
		assert(
			this.replyData === undefined,
			"This CommandInteraction has already received a reply",
		);
		this.replyData = data.reply;
		this.onReplySignal.Fire();
	}

	/**
	 * Replies to the interaction, indicating an error has occurred.
	 *
	 * @param text the reply text
	 */
	error(text: string) {
		this.setReply(text, false);
	}

	onReply(callback: () => void) {
		this.onReplySignal.Event.Connect(callback);
	}

	destroy() {
		this.onReplySignal.Destroy();
	}

	isReplyReceived() {
		return this.replyData !== undefined;
	}

	getReply() {
		return this.replyData;
	}

	private setReply(text: string, success: boolean) {
		assert(
			this.replyData === undefined,
			"This CommandInteraction has already received a reply",
		);
		this.replyData = {
			text,
			success,
			sentAt: os.time(),
		};
		this.onReplySignal.Fire();
	}
}
