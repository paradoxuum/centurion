import { Players } from "@rbxts/services";
import { CommandPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { DEFAULT_HISTORY_LENGTH } from "./options";
import { ClientOptions, HistoryEntry } from "./types";

export class ClientDispatcher extends BaseDispatcher {
	private readonly history: HistoryEntry[] = [];
	private readonly historyEvent = new Instance("BindableEvent");
	private maxHistoryLength = DEFAULT_HISTORY_LENGTH;

	/**
	 * Initialises the client dispatcher.
	 *
	 * @param options the client options provided when starting Commander
	 */
	init(options: ClientOptions) {
		this.maxHistoryLength = options.historyLength ?? DEFAULT_HISTORY_LENGTH;
	}

	/**
	 * Executes a command.
	 *
	 * @param path the path of the command
	 * @param text the text input used to execute the command
	 * @returns a {@link HistoryEntry} containing the command's response
	 */
	async run(path: CommandPath, text = "") {
		const [success, interaction] = this.executeCommand(
			path,
			Players.LocalPlayer,
			text,
		).await();
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

		const reply = interaction.getData().reply;
		assert(reply !== undefined, "Reply not received");

		const entry: HistoryEntry = {
			text: reply.text,
			success: reply.success,
			sentAt: reply.sentAt,
		};

		this.addHistoryEntry(entry);
		return entry;
	}

	getHistory() {
		return this.history;
	}

	/**
	 * Gets the history signal, which will be fired each time a new
	 * {@link HistoryEntry} is added.
	 *
	 * @returns the history signal
	 */
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
