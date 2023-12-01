import { Players } from "@rbxts/services";
import { CommandPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { DEFAULT_HISTORY_LENGTH, DEFAULT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { ClientOptions, HistoryEntry } from "./types";

export class ClientDispatcher extends BaseDispatcher {
	private readonly history: HistoryEntry[] = [];
	private readonly historyEvent = new Instance("BindableEvent");
	private maxHistoryLength = DEFAULT_HISTORY_LENGTH;

	constructor(registry: ClientRegistry) {
		super(registry);
	}

	init(options: ClientOptions) {
		this.maxHistoryLength = options.historyLength ?? DEFAULT_OPTIONS.historyLength!;
	}

	async run(path: CommandPath, text: string = "") {
		const [success, interaction] = this.executeCommand(path, Players.LocalPlayer, text).await();
		if (!success) {
			warn(`An error occurred while executing '${text}': ${interaction}`);

			const errorEntry: HistoryEntry = {
				text: "An error occurred.",
				success: false,
				sentAt: os.time(),
			};
			this.addHistoryEntry(errorEntry);
			return errorEntry;
		}

		const entry: HistoryEntry = {
			text: interaction.getReplyText()!,
			success: interaction.isReplySuccess()!,
			sentAt: interaction.getReplyTime()!,
		};

		this.addHistoryEntry(entry);
		return entry;
	}

	getHistory() {
		return this.history;
	}

	getHistorySignal() {
		return this.historyEvent.Event;
	}

	private addHistoryEntry(entry: HistoryEntry) {
		if (this.history.size() >= this.maxHistoryLength) {
			this.history.remove(0);
		}

		this.history.push(entry);
		this.historyEvent.Fire(entry);
	}
}
