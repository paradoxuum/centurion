import { CommandInteractionData } from "../types";

export class CommandInteraction {
	private onReplySignal = new Instance("BindableEvent");
	private replySuccess?: boolean;
	private replyText?: string;
	private replyTime?: number;

	constructor(
		readonly executor: Player,
		readonly text: string,
	) {}

	static fromData(data: CommandInteractionData) {
		const interaction = new CommandInteraction(data.executor, data.text);
		interaction.replySuccess = data.replySuccess;
		interaction.replyText = data.replyText;
		interaction.replyTime = data.replyTime;
		return interaction;
	}

	getData(): CommandInteractionData {
		return {
			executor: this.executor,
			text: this.text,
			replySuccess: this.replySuccess,
			replyText: this.replyText,
			replyTime: this.replyTime,
		};
	}

	reply(text: string) {
		this.setReply(text, true);
	}

	replyFromData(data: CommandInteractionData) {
		if (data.replyText === undefined) {
			return;
		}

		assert(this.replyText === undefined, "This CommandInteraction has already received a reply");
		this.replySuccess = data.replySuccess;
		this.replyText = data.replyText;
		this.replyTime = data.replyTime;
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

	isReplySuccess() {
		return this.replySuccess;
	}

	isReplyReceived() {
		return this.replyText !== undefined;
	}

	getReplyText() {
		return this.replyText;
	}

	getReplyTime() {
		return this.replyTime;
	}

	private setReply(text: string, success: boolean) {
		assert(this.replyText === undefined, "This CommandInteraction has already received a reply");
		this.replyText = text;
		this.replySuccess = success;
		this.replyTime = os.time();
		this.onReplySignal.Fire();
	}
}
