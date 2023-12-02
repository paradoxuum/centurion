import { RunService } from "@rbxts/services";
import { mergeDeep } from "@rbxts/sift/out/Dictionary";
import { RunCallback } from "../shared/core/types";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { AppData, ClientOptions } from "./types";

export namespace CommanderClient {
	let started = false;
	const registryInstance = new ClientRegistry();
	const dispatcherInstance = new ClientDispatcher(registryInstance);
	let optionsObject = DEFAULT_OPTIONS;

	const IS_CLIENT = RunService.IsClient();

	export async function start(
		callback: RunCallback,
		options: ClientOptions = DEFAULT_OPTIONS,
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
			options.app(getAppData());
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

	export function getAppData(): AppData {
		return {
			options: optionsObject,
			execute: (path, text) => dispatcherInstance.run(path, text),
			commands: registryInstance.getCommandOptions(),
			groups: registryInstance.getGroupOptions(),
			history: dispatcherInstance.getHistory(),
			onHistoryUpdated: dispatcherInstance.getHistorySignal(),
		};
	}

	function assertAccess(name: string) {
		assert(IS_CLIENT, `Client ${name} cannot be accessed from the server`);
		assert(started, "Commander has not been started yet");
	}
}
