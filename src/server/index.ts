import { RunService } from "@rbxts/services";
import { mergeDeep } from "@rbxts/sift/out/Dictionary";
import { ServerDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ServerRegistry } from "./registry";

const IS_SERVER = RunService.IsServer();

export namespace CommanderServer {
	let started = false;
	const registryInstance = new ServerRegistry();
	const dispatcherInstance = new ServerDispatcher(registryInstance);
	let optionsObject = DEFAULT_OPTIONS;

	/**
	 * Starts {@link CommanderServer}.
	 *
	 * All registration must be done in the provided callback.
	 *
	 * @param callback the run callback
	 * @param options server options
	 */
	export async function start(
		callback: (run: ServerRegistry) => void,
		options = DEFAULT_OPTIONS,
	) {
		assert(IS_SERVER, "CommanderServer can only be started from the server");
		assert(!started, "Commander has already been started");

		optionsObject = mergeDeep(DEFAULT_OPTIONS, options);

		dispatcherInstance.init();
		registryInstance.init(optionsObject);
		callback(registryInstance);
		registryInstance.freeze();
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
