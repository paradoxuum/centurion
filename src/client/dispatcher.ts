import { Signal } from "@rbxts/beacon";
import { Players } from "@rbxts/services";
import { RegistryPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { getInputText } from "../shared/util/string";
import { DEFAULT_CLIENT_OPTIONS } from "./options";
import { ClientOptions, HistoryEntry } from "./types";

export class ClientDispatcher extends BaseDispatcher {
	private readonly history: HistoryEntry[] = [];
	private maxHistoryLength = DEFAULT_CLIENT_OPTIONS.historyLength;
	readonly historyUpdated = new Signal<[history: HistoryEntry[]]>();

	/**
	 * Initialises the client dispatcher.
	 *
	 * @param options The client options provided when starting Commander
	 */
	init(options: ClientOptions) {
		super.init(options);
		this.maxHistoryLength = options.historyLength;
	}

	/**
	 * Executes a command.
	 *
	 * @param path The path of the command
	 * @param args The command's arguments
	 * @returns A {@link HistoryEntry} containing the command's response
	 */
	async run(path: RegistryPath, args: string[] = []) {
		const inputText = getInputText(path, args);
		const [success, context] = this.executeCommand(
			path,
			Players.LocalPlayer,
			inputText,
			args,
		).await();

		if (!success) {
			warn(`An error occurred while executing '${inputText}': ${context}`);

			const errorEntry: HistoryEntry = {
				text: "An error occurred.",
				success: false,
				sentAt: os.time(),
			};
			this.addHistoryEntry(errorEntry);
			return errorEntry;
		}

		const reply = context.getData().reply;
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
	 * Adds a {@link HistoryEntry} to the history.
	 *
	 * If the number of history entries would exceed the limit if it were added,
	 * the oldest history entry will be removed.
	 *
	 * @param entry - The history entry to add
	 */
	addHistoryEntry(entry: HistoryEntry) {
		if (this.history.size() >= this.maxHistoryLength) {
			this.history.remove(0);
		}

		this.history.push(entry);
		this.historyUpdated.Fire(this.history);
	}
}
