import { RunService } from "@rbxts/services";
import { DEFAULT_CONFIG } from "../shared/config";
import { getRemotes } from "../shared/network";
import { ClientDispatcher } from "./dispatcher";
import { ClientRegistry } from "./registry";
import { ClientConfig } from "./types";

export class CenturionClient {
	private started = false;
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
	}

	/**
	 * Starts {@link CenturionServer}.
	 *
	 * @param callback A callback that is called after the registry has been initialized.
	 */
	async start(callback?: (registry: ClientRegistry) => void) {
		assert(!this.started, "Centurion has already been started");

		this.registry.init();
		this.dispatcher.init();
		callback?.(this.registry);
		await this.registry.sync();
		this.started = true;
		this.config.interface?.({
			registry: this.registry,
			dispatcher: this.dispatcher,
			config: this.config,
		});
	}
}
