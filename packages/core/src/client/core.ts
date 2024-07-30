import { RunService, UserInputService } from "@rbxts/services";
import { CommandShortcut } from "../shared";
import { DEFAULT_CONFIG } from "../shared/config";
import { BaseCommand } from "../shared/core/command";
import { getRemotes } from "../shared/network";
import { CenturionLogger } from "../shared/util/log";
import { ClientDispatcher } from "./dispatcher";
import { ClientRegistry } from "./registry";
import { ClientConfig } from "./types";
import { getShortcutKeycodes, isShortcutContext } from "./util";

export class CenturionClient {
	private started = false;
	private readonly logger: CenturionLogger;
	readonly registry: ClientRegistry;
	readonly dispatcher: ClientDispatcher;
	readonly config: ClientConfig;

	constructor(config: Partial<ClientConfig> = {}) {
		assert(
			RunService.IsClient(),
			"CenturionClient can only be created from the client",
		);

		let networkConfig = config.network;
		if (networkConfig === undefined) {
			const remotes = getRemotes();
			networkConfig = {
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

		this.config = {
			...DEFAULT_CONFIG,
			historyLength: 1000,
			registerBuiltInCommands: true,
			shortcutsEnabled: true,
			syncTimeout: 10,
			network: networkConfig,
			...config,
		};
		this.registry = new ClientRegistry(this.config);
		this.dispatcher = new ClientDispatcher(this.config, this.registry);
		this.logger = new CenturionLogger(this.config.logLevel, "Core");
	}

	/**
	 * Starts {@link CenturionServer}.
	 *
	 * @param callback A callback that is called after the registry has been initialized.
	 */
	async start(callback?: (registry: ClientRegistry) => void) {
		this.logger.assert(!this.started, "Centurion has already been started");

		this.registry.init();
		if (this.config.registerBuiltInCommands) {
			const commands =
				script.Parent?.WaitForChild("builtin").WaitForChild("commands");
			this.logger.assert(
				commands !== undefined,
				"Failed to locate built-in commands",
			);
			this.registry.load(commands);
		}

		if (this.config.shortcutsEnabled) {
			this.registry.commandRegistered.Connect((command) =>
				this.registerShortcuts(command),
			);
		}

		callback?.(this.registry);
		await this.registry.sync();
		this.started = true;
		this.config.interface?.({
			registry: this.registry,
			dispatcher: this.dispatcher,
			config: this.config,
		});
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

				this.dispatcher.run(commandPath, args);
			});
		}
	}
}
