import { RunService } from "@rbxts/services";
import { mergeDeep } from "@rbxts/sift/out/Dictionary";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_CLIENT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { ClientOptions, CommanderEvents } from "./types";

export namespace CommanderClient {
	let started = false;
	const events: CommanderEvents = {
		historyUpdated: new Instance("BindableEvent"),
		commandAdded: new Instance("BindableEvent"),
		groupAdded: new Instance("BindableEvent"),
	};
	const registryInstance = new ClientRegistry(events);
	const dispatcherInstance = new ClientDispatcher(registryInstance, events);
	let optionsObject = DEFAULT_CLIENT_OPTIONS;

	const IS_CLIENT = RunService.IsClient();

	/**
	 * Starts {@link CommanderClient}.
	 *
	 * All registration must be done in the provided callback.
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

		optionsObject = mergeDeep(DEFAULT_CLIENT_OPTIONS, options);
		dispatcherInstance.init(optionsObject);
		registryInstance.init(optionsObject);

		callback?.(registryInstance);
		await registryInstance.sync();
		started = true;

		if (options.app !== undefined) {
			options.app({
				options: optionsObject,
				execute: (path, text) => dispatcherInstance.run(path, text),
				addHistoryEntry: (entry) => dispatcherInstance.addHistoryEntry(entry),
				initialData: {
					commands: registryInstance.getCommandOptions(),
					groups: registryInstance.getGroupOptions(),
					history: dispatcherInstance.getHistory(),
				},
				events: {
					historyUpdated: events.historyUpdated.Event,
					commandAdded: events.commandAdded.Event,
					groupAdded: events.groupAdded.Event,
				},
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
