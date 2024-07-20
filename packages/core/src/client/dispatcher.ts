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
	 * Initializes the client dispatcher.
	 *
	 * @param options Client options
	 * @ignore
	 */
	init(options: ClientOptions) {
		super.init(options);
		this.maxHistoryLength = options.historyLength;
	}

	/**
	 * Executes a command.
	 *
	 * If the path points to a server command, the command will be executed on the server.
	 *
	 * If `runAsPlayer` is set to `false`, the command will be executed with no executor. This only
	 * applies to commands registered on the client - commands registered on the server will always
	 * execute with the local player as the executor.
	 *
	 * @param path The command's path.
	 * @param args The arguments to pass to the command.
	 * @param runAsPlayer Whether to run the command as the local player.
	 * @returns A {@link HistoryEntry} containing the command's response
	 * @returns A {@link Promise} that resolves when the command has been executed. The value contained in the
	 * Promise is a `HistoryEntry` object containing the command's response and the time it was executed.
	 */
	async run(path: RegistryPath, args: string[] = [], runAsPlayer = true) {
		const inputText = getInputText(path, args);
		const [success, context] = this.executeCommand(
			path,
			inputText,
			args,
			runAsPlayer ? Players.LocalPlayer : undefined,
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
		if (reply === undefined) return;

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

	/**
	 * Removes all history entries.
	 */
	clearHistory() {
		this.history.clear();
		this.historyUpdated.Fire(this.history);
	}
}
