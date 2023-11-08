export class CommandInteraction {
	private onReplySignal = new Instance("BindableEvent");
	private replySuccess?: boolean;
	private replyText?: string;

	constructor(
		readonly executor: Player,
		readonly text: string,
	) {}

	reply(text: string) {
		this.setReply(text, true);
	}

	error(text: string) {
		this.setReply(text, false);
	}

	onReply(callback: (text: string, success: boolean) => void) {
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

	private setReply(text: string, success: boolean) {
		assert(this.replyText === undefined, "This CommandInteraction has already received a reply");
		this.replyText = text;
		this.replySuccess = success;
		this.onReplySignal.Fire(text, success);
	}
}
