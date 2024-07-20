import { RunService, UserInputService } from "@rbxts/services";
import { CommandShortcut } from "../shared";
import { BaseCommand } from "../shared/core/command";
import { getRemotes } from "../shared/network";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_CLIENT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { ClientOptions } from "./types";
import { getShortcutKeycodes, isShortcutContext } from "./util";

export namespace CenturionClient {
	let started = false;
	const registryInstance = new ClientRegistry();
	const dispatcherInstance = new ClientDispatcher(registryInstance);
	let optionsObject = DEFAULT_CLIENT_OPTIONS;

	const IS_CLIENT = RunService.IsClient();

	/**
	 * Starts {@link CenturionClient}.
	 *
	 * @param callback The run callback
	 * @param options Client options
	 */
	export async function start(
		callback?: (registry: ClientRegistry) => void,
		options: Partial<ClientOptions> = {},
	) {
		assert(IS_CLIENT, "CenturionClient can only be started from the client");
		assert(!started, "Centurion has already been started");

		optionsObject = {
			...DEFAULT_CLIENT_OPTIONS,
			...options,
		};

		if (optionsObject.network === undefined) {
			const remotes = getRemotes();
			optionsObject.network = {
				syncStart: {
					Fire: () => remotes.syncStart.FireServer(),
				},
				syncDispatch: {
					Connect: (callback) => {
						remotes.syncDispatch.OnClientEvent.Connect(callback);
					},
				},
				execute: {
					Invoke: (path, args) => remotes.execute.InvokeServer(path, args),
				},
			};
		}

		dispatcherInstance.init(optionsObject);
		registryInstance.init(optionsObject);

		if (optionsObject.registerBuiltInCommands) {
			const commands =
				script.Parent?.WaitForChild("builtin").WaitForChild("commands");
			assert(commands !== undefined, "Could not find built-in commands");
			registryInstance.load(commands);
			registryInstance.register();
		}

		if (optionsObject.shortcutsEnabled) {
			registryInstance.commandRegistered.Connect(registerShortcuts);
		}

		callback?.(registryInstance);
		await registryInstance.sync();
		started = true;
		options.interface?.({
			registry: registryInstance,
			dispatcher: dispatcherInstance,
			options: optionsObject,
		});
	}

	export function registry() {
		assertAccess("registry");
		return registryInstance;
	}

	export function dispatcher() {
		assertAccess("dispatcher");
		return dispatcherInstance;
	}

	export function options() {
		assertAccess("options");
		return optionsObject;
	}

	function assertAccess(name: string) {
		assert(IS_CLIENT, `Client ${name} cannot be accessed from the server`);
		assert(started, "Centurion has not been started yet");
	}

	function registerShortcuts(command: BaseCommand) {
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

				dispatcherInstance.run(commandPath, args);
			});
		}
	}
}
