import { CommandInteractionData, CommandReply } from "../types";

export class CommandInteraction {
	private onReplySignal = new Instance("BindableEvent");
	private replyData?: CommandReply;

	constructor(readonly executor: Player, readonly text: string) {}

	static fromData(data: CommandInteractionData) {
		const interaction = new CommandInteraction(data.executor, data.text);
		interaction.replyData = data.reply;
		return interaction;
	}

	getData(): CommandInteractionData {
		return {
			executor: this.executor,
			text: this.text,
			reply: this.replyData,
		};
	}

	reply(text: string) {
		this.setReply(text, true);
	}

	replyFromData(data: CommandInteractionData) {
		assert(
			this.replyData === undefined,
			"This CommandInteraction has already received a reply",
		);
		this.replyData = data.reply;
		this.onReplySignal.Fire();
	}

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
