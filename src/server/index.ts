import { RunService } from "@rbxts/services";
import { RunCallback } from "../shared/core/types";
import { ServerDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ServerRegistry } from "./registry";
import { ServerOptions } from "./types";

const IS_SERVER = RunService.IsServer();

export namespace CommanderServer {
	let started = false;
	const registryInstance = new ServerRegistry();
	const dispatcherInstance = new ServerDispatcher(registryInstance);
	let optionsObject = DEFAULT_OPTIONS;

	export async function start(callback: RunCallback, options?: ServerOptions) {
		assert(IS_SERVER, "CommanderServer can only be started from the server");
		assert(!started, "Commander has already been started");

		optionsObject = options ?? DEFAULT_OPTIONS;

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
