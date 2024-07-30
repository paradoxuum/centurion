import { RunService } from "@rbxts/services";
import { DEFAULT_CONFIG } from "../shared/config";
import { getRemotes } from "../shared/network";
import { CenturionLogger } from "../shared/util/log";
import { ServerDispatcher } from "./dispatcher";
import { ServerRegistry } from "./registry";
import { ServerConfig } from "./types";

export class CenturionServer {
	private started = false;
	private readonly logger: CenturionLogger;
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
		this.logger = new CenturionLogger(this.config.logLevel, "Core");
	}

	/**
	 * Starts {@link CenturionServer}.
	 */
	async start(callback?: (registry: ServerRegistry) => void) {
		this.logger.assert(!this.started, "Centurion has already been started");

		this.dispatcher.init();
		this.registry.init();
		callback?.(this.registry);
		this.started = true;
	}
}