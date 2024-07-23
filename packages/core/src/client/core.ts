import { RunService, UserInputService } from "@rbxts/services";
import { CommandShortcut } from "../shared";
import { BaseCommand } from "../shared/core/command";
import { getRemotes } from "../shared/network";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_CLIENT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { ClientOptions } from "./types";
import { getShortcutKeycodes, isShortcutContext } from "./util";

export class CenturionClient {
	private started = false;
	private registryInstance = new ClientRegistry();
	private dispatcherInstance = new ClientDispatcher(this.registryInstance);
	private optionsObject = DEFAULT_CLIENT_OPTIONS;

	constructor(options: Partial<ClientOptions> = {}) {
		assert(
			RunService.IsClient(),
			"CenturionClient can only be created from the client",
		);
		this.optionsObject = {
			...DEFAULT_CLIENT_OPTIONS,
			...options,
		};
	}

	/**
	 * Starts {@link CenturionClient}.
	 *
	 * @param callback The run callback
	 * @param options Client options
	 */
	async start(callback?: (registry: ClientRegistry) => void) {
		assert(!this.started, "Centurion has already been started");
		if (this.optionsObject.network === undefined) {
			const remotes = getRemotes();
			this.optionsObject.network = {
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

		const dispatcher = this.dispatcherInstance;
		const registry = this.registryInstance;
		const options = this.optionsObject;

		dispatcher.init(options);
		registry.init(options);

		if (this.optionsObject.registerBuiltInCommands) {
			const commands =
				script.Parent?.WaitForChild("builtin").WaitForChild("commands");
			assert(commands !== undefined, "Could not find built-in commands");
			this.registryInstance.load(commands);
		}

		if (this.optionsObject.shortcutsEnabled) {
			registry.commandRegistered.Connect((command) =>
				this.registerShortcuts(command),
			);
		}

		callback?.(this.registryInstance);
		await this.registryInstance.sync();
		this.started = true;
		options.interface?.({
			registry,
			dispatcher,
			options,
		});
	}

	registry() {
		this.assertAccess("registry");
		return this.registryInstance;
	}

	dispatcher() {
		this.assertAccess("dispatcher");
		return this.dispatcherInstance;
	}

	options() {
		this.assertAccess("options");
		return this.optionsObject;
	}

	private assertAccess(name: string) {
		assert(this.started, "Centurion has not been started yet");
	}

	private registerShortcuts(command: BaseCommand) {
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

				this.dispatcherInstance.run(commandPath, args);
			});
		}
	}
}
