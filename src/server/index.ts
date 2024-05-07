import { RunService } from "@rbxts/services";
import { getRemotes } from "../shared/network";
import { ServerDispatcher } from "./dispatcher";
import { DEFAULT_SERVER_OPTIONS } from "./options";
import { ServerRegistry } from "./registry";
import { ServerOptions } from "./types";

const IS_SERVER = RunService.IsServer();

export namespace CommanderServer {
	let started = false;
	const registryInstance = new ServerRegistry();
	const dispatcherInstance = new ServerDispatcher(registryInstance);
	let optionsObject = DEFAULT_SERVER_OPTIONS;

	/**
	 * Starts {@link CommanderServer}.
	 *
	 * @param callback The run callback
	 * @param options Server options
	 */
	export async function start(
		callback?: (registry: ServerRegistry) => void,
		options: Partial<ServerOptions> = {},
	) {
		assert(IS_SERVER, "CommanderServer can only be started from the server");
		assert(!started, "Commander has already been started");

		optionsObject = {
			...DEFAULT_SERVER_OPTIONS,
			...options,
		};

		if (optionsObject.network === undefined) {
			const remotes = getRemotes();
			optionsObject.network = {
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

		dispatcherInstance.init(optionsObject);
		registryInstance.init(optionsObject);
		callback?.(registryInstance);
		started = true;
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
		assert(IS_SERVER, `Server ${name} cannot be accessed from the server`);
		assert(started, "Commander has not been started yet");
	}
}
