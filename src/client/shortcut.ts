import { UserInputService } from "@rbxts/services";
import { Shortcut, ShortcutContext } from "../shared";
import { BaseCommand } from "../shared/core/command";
import { CommanderClient } from "./core";
import { store } from "./interface/store";

import { ContextActionService } from "@rbxts/services";

let connections: RBXScriptConnection[] = [];

function disconnectConnections() {
	for (const connection of connections) {
		(connection as RBXScriptConnection).Disconnect();
	}
	connections = [];
}

/**
 * @name parseShortcutsArray
 * @description Registers the keybind events for commands.
 */
function registerCommandShortcuts(
	shortcuts: Shortcut,
	command: BaseCommand,
	createTouchButtons?: boolean,
) {
	const dispatcher = CommanderClient.dispatcher();

	const options = CommanderClient.options();

	// Loop over each array
	shortcuts.forEach((shortcut, index) => {
		if (
			typeIs(shortcut, "table") &&
			(shortcut as ShortcutContext).actionName === undefined
		) {
			// The shortcut is multiple keys.
			const connection = UserInputService.InputBegan.Connect((input) => {
				// Get all relevant keys.
				const keysPressed = UserInputService.GetKeysPressed().filter(
					(input) => {
						const shortcutsThatMatch = (shortcut as Enum.KeyCode[]).filter(
							(value) => {
								return value === input.KeyCode;
							},
						);

						if (shortcutsThatMatch.size() > 0) {
							return true;
						}
					},
				);

				// If less keys then needed are pressed, return.
				if (keysPressed.size() < (shortcut as Enum.KeyCode[]).size()) return;

				// Prevent commands from running while using other commands.
				if (!store.getState().app.visible) {
					dispatcher.run(command.getPath());
				}
			});

			connections.push(connection);
		} else if (typeIs(shortcut, "Enum")) {
			// The shortcut is a single key.

			const connection = UserInputService.InputBegan.Connect((input) => {
				if (input.KeyCode === (shortcut as unknown as Enum.KeyCode)) {
					// Prevent commands from running while using other commands.
					if (!store.getState().app.visible) {
						dispatcher.run(command.getPath());
					}
				}
			});
			connections.push(connection);
		} else {
			// Asume that shortcut is a ShortcutContext if all other types fail.

			ContextActionService.BindAction(
				(shortcut as ShortcutContext).actionName,
				(actionName, inputState, input) => {
					if (
						actionName === (shortcut as ShortcutContext).actionName &&
						inputState === Enum.UserInputState.Begin
					) {
						dispatcher.run(command.getPath());
					}
				},
				createTouchButtons ?? false,
				...((shortcut as ShortcutContext).activations ?? []),
			);
		}
	});
}

export function shortcuts(createTouchButtons?: boolean) {
	// Prevent react renders from causing multiple command executions.
	if (connections.size() !== 0) return;

	const registry = CommanderClient.registry();

	// Update connections when new commands are registered.
	registry.commandRegistered.Connect((command) => {
		if (command.options.shortcuts !== undefined) {
			disconnectConnections();
			registerCommandShortcuts(
				command.options.shortcuts as Shortcut,
				command,
				createTouchButtons,
			);
		}
	});

	// Wait to make sure commands aren't nil.
	while (registry.getCommands() === undefined) task.wait();

	for (const command of registry.getCommands()) {
		if (command.options.shortcuts !== undefined) {
			registerCommandShortcuts(
				command.options.shortcuts as Shortcut,
				command,
				createTouchButtons,
			);
		}
	}
}
