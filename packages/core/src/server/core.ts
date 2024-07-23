import { RunService } from "@rbxts/services";
import { getRemotes } from "../shared/network";
import { ServerDispatcher } from "./dispatcher";
import { DEFAULT_SERVER_OPTIONS } from "./options";
import { ServerRegistry } from "./registry";
import { ServerOptions } from "./types";

export class CenturionServer {
	private started = false;
	private registryInstance = new ServerRegistry();
	private dispatcherInstance = new ServerDispatcher(this.registryInstance);
	private optionsObject = DEFAULT_SERVER_OPTIONS;

	constructor(options: Partial<ServerOptions> = {}) {
		assert(
			RunService.IsServer(),
			"CenturionServer can only be created from the server",
		);
		this.optionsObject = {
			...DEFAULT_SERVER_OPTIONS,
			...options,
		};
	}

	/**
	 * Starts {@link CenturionServer}.
	 *
	 * @param callback The run callback
	 * @param options Server options
	 */
	async start(callback?: (registry: ServerRegistry) => void) {
		assert(!this.started, "Centurion has already been started");

		const dispatcher = this.dispatcherInstance;
		const registry = this.registryInstance;
		const options = this.optionsObject;

		if (options.network === undefined) {
			const remotes = getRemotes();
			this.optionsObject.network = {
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

		dispatcher.init(options);
		registry.init(options);
		callback?.(registry);
		this.started = true;
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

	assertAccess(name: string) {
		assert(this.started, "Centurion has not been started yet");
	}
}
