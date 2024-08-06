import { Signal } from "@rbxts/beacon";
import { Players, UserInputService } from "@rbxts/services";
import { CommandShortcut, RegistryPath } from "../shared";
import { BaseCommand } from "../shared/core/command";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { ReadonlyDeep } from "../shared/util/data";
import { getInputText } from "../shared/util/string";
import { ClientConfig, HistoryEntry } from "./types";
import { getShortcutKeycodes, isShortcutContext } from "./util";

export class ClientDispatcher extends BaseDispatcher<
	ReadonlyDeep<ClientConfig>
> {
	private readonly history: HistoryEntry[] = [];
	readonly historyUpdated = new Signal<[history: HistoryEntry[]]>();

	/**
	 * Initializes the client dispatcher.
	 *
	 * @internal
	 * @ignore
	 */
	init() {
		if (this.config.shortcutsEnabled) {
			this.registry.commandRegistered.Connect((command) =>
				this.handleShortcuts(command),
			);
		}
	}

	/**
	 * Executes a command.
	 *
	 * If the path points to a server command, the command will be executed on the server.
	 *
	 * @param path The command's path.
	 * @param args The arguments to pass to the command.
	 * @returns A {@link HistoryEntry} containing the command's response
	 * @returns A {@link Promise} that resolves when the command has been executed. The value contained in the
	 * Promise is a `HistoryEntry` object containing the command's response and the time it was executed.
	 */
	async run(path: RegistryPath, args: string[] = []) {
		const inputText = getInputText(path, args);
		const [success, context] = this.executeCommand(
			Players.LocalPlayer,
			path,
			inputText,
			args,
		).await();

		if (!success) {
			this.logger.warn(
				`An error occurred while executing '${inputText}': ${context}`,
			);

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
		if (this.history.size() >= this.config.historyLength) {
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

	private handleShortcuts(command: BaseCommand) {
		if (command.options.shortcuts === undefined) return;

		const commandPath = command.getPath();
		for (const shortcut of command.options.shortcuts) {
			const keys = new Set(getShortcutKeycodes(shortcut as CommandShortcut));
			const keyCount = keys.size();
			if (keyCount === 0) continue;

			const args = isShortcutContext(shortcut) ? shortcut.arguments : undefined;
			UserInputService.InputBegan.Connect((input, gameProcessed) => {
				if (gameProcessed) return;
				if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

				const keysPressed = UserInputService.GetKeysPressed();
				if (
					keysPressed.size() !== keyCount ||
					!keysPressed.every((key) => keys.has(key.KeyCode))
				) {
					return;
				}

				this.run(commandPath, args);
			});
		}
	}
}
