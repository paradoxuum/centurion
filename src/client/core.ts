import { RunService } from "@rbxts/services";
import { mergeDeep } from "@rbxts/sift/out/Dictionary";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";

export namespace CommanderClient {
	let started = false;
	const registryInstance = new ClientRegistry();
	const dispatcherInstance = new ClientDispatcher(registryInstance);
	let optionsObject = DEFAULT_OPTIONS;

	const IS_CLIENT = RunService.IsClient();

	/**
	 * Starts {@link CommanderClient}.
	 *
	 * All registration must be done in the provided callback.
	 *
	 * @param callback the run callback
	 * @param options client options
	 */
	export async function start(
		callback: (run: ClientRegistry) => void,
		options = DEFAULT_OPTIONS,
	) {
		assert(IS_CLIENT, "CommanderClient can only be started from the client");
		assert(!started, "Commander has already been started");

		optionsObject = mergeDeep(DEFAULT_OPTIONS, options);

		registryInstance.init();
		dispatcherInstance.init(options);

		callback(registryInstance);
		await registryInstance.sync();

		registryInstance.freeze();
		started = true;

		if (options.app !== undefined) {
			options.app({
				options: optionsObject,
				execute: (path, text) => dispatcherInstance.run(path, text),
				commands: registryInstance.getCommandOptions(),
				groups: registryInstance.getGroupOptions(),
				history: dispatcherInstance.getHistory(),
				onHistoryUpdated: dispatcherInstance.getHistorySignal(),
			});
		}
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
}
