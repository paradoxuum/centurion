import { RunService } from "@rbxts/services";
import { RunCallback } from "../shared/core/types";
import { ServerDispatcher } from "./dispatcher";
import { ServerRegistry } from "./registry";

const IS_SERVER = RunService.IsServer();

export namespace CommanderServer {
	let started = false;
	const registryInstance = new ServerRegistry();
	const dispatcherInstance = new ServerDispatcher(registryInstance);

	export async function start(callback: RunCallback) {
		assert(IS_SERVER, "CommanderServer can only be started from the server");
		assert(!started, "Commander has already been started");

		dispatcherInstance.init();
		registryInstance.init();
		await callback(registryInstance);
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

	function assertAccess(name: string) {
		assert(IS_SERVER, `Server ${name} cannot be accessed from the server`);
		assert(started, "Commander has not been started yet");
	}
}
