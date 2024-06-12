import { RunService, UserInputService } from "@rbxts/services";
import { BaseCommand } from "../shared/core/command";
import { getRemotes } from "../shared/network";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_CLIENT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { ClientOptions } from "./types";

export namespace CommanderClient {
	let started = false;
	const registryInstance = new ClientRegistry();
	const dispatcherInstance = new ClientDispatcher(registryInstance);
	let optionsObject = DEFAULT_CLIENT_OPTIONS;

	const IS_CLIENT = RunService.IsClient();

	/**
	 * Starts {@link CommanderClient}.
	 *
	 * @param callback The run callback
	 * @param options Client options
	 */
	export async function start(
		callback?: (registry: ClientRegistry) => void,
		options: Partial<ClientOptions> = {},
	) {
		assert(IS_CLIENT, "CommanderClient can only be started from the client");
		assert(!started, "Commander has already been started");

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
					Invoke: (path, text) => remotes.execute.InvokeServer(path, text),
				},
			};
		}

		dispatcherInstance.init(optionsObject);
		registryInstance.init(optionsObject);
		registryInstance.commandRegistered.Connect(registerShortcuts);

		callback?.(registryInstance);
		await registryInstance.sync();
		started = true;
		options.interface?.();
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
		assert(started, "Commander has not been started yet");
	}

	function registerShortcuts(command: BaseCommand) {
		if (command.options.shortcuts === undefined) return;

		const commandPath = command.getPath();
		for (const shortcuts of command.options.shortcuts) {
			const keys = typeIs(shortcuts, "table")
				? new Set(shortcuts as Enum.KeyCode[])
				: new Set([shortcuts as Enum.KeyCode]);
			const keyCount = keys.size();

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

				dispatcherInstance.run(commandPath);
			});
		}
	}
}
