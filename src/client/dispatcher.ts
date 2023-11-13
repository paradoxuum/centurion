import { Players } from "@rbxts/services";
import { CommandPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { ClientRegistry } from "./registry";
import { HistoryEntry } from "./types";

export class ClientDispatcher extends BaseDispatcher {
	private readonly history: HistoryEntry[] = [];
	private readonly historyEvent = new Instance("BindableEvent");

	constructor(registry: ClientRegistry) {
		super(registry);
	}

	async run(path: CommandPath, text: string) {
		const interaction = await this.executeCommand(path, Players.LocalPlayer, text);
		if (!interaction.isReplyReceived()) {
			return;
		}

		const entry: HistoryEntry = {
			text: interaction.getReplyText()!,
			success: interaction.isReplySuccess()!,
			sentAt: interaction.getReplyTime()!,
		};

		this.history.push(entry);
		this.historyEvent.Fire(entry);
	}

	getHistory() {
		return this.history;
	}

	getHistorySignal() {
		return this.historyEvent.Event;
	}
}
