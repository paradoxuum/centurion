import { RunService } from "@rbxts/services";
import { DEFAULT_CONFIG } from "../shared/config";
import { getRemotes } from "../shared/network";
import { ServerDispatcher } from "./dispatcher";
import { ServerRegistry } from "./registry";
import { ServerConfig } from "./types";

export class CenturionServer {
	private started = false;
	readonly registry: ServerRegistry;
	readonly dispatcher: ServerDispatcher;
	readonly config: Readonly<ServerConfig>;

	constructor(config: Partial<ServerConfig> = {}) {
		assert(
			RunService.IsServer(),
			"CenturionServer can only be created from the server",
		);

		let networkConfig = config.network;
		if (networkConfig === undefined) {
			const remotes = getRemotes();
			networkConfig = {
				syncStart: {
					Connect: (player) => {
						return remotes.syncStart.OnServerEvent.Connect(player);
					},
				},
				syncDispatch: {
					Fire: (player, data) => remotes.syncDispatch.FireClient(player, data),
				},
				execute: {
					SetCallback: (callback) => {
						remotes.execute.OnServerInvoke = callback;
					},
				},
			};
		}

		this.config = table.freeze({
			...DEFAULT_CONFIG,
			network: networkConfig,
			commandFilter: () => true,
			...config,
		});
		this.registry = new ServerRegistry(this.config);
		this.dispatcher = new ServerDispatcher(this.config, this.registry);
	}

	/**
	 * Starts {@link CenturionServer}.
	 *
	 * @param callback A callback that is called after the registry has been initialized.
	 */
	async start(callback?: (registry: ServerRegistry) => void) {
		assert(!this.started, "Centurion has already been started");

		this.registry.init();
		this.dispatcher.init();
		callback?.(this.registry);
		this.started = true;
	}
}
