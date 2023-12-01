import { RunService } from "@rbxts/services";
import { RunCallback } from "../shared/core/types";
import { ServerDispatcher } from "./dispatcher";
import { ServerRegistry } from "./registry";

const IS_SERVER = RunService.IsServer();

export class CommanderServer {
	private static started = false;
	private static readonly registryInstance = new ServerRegistry();
	private static readonly dispatcherInstance = new ServerDispatcher(CommanderServer.registryInstance);

	static async start(callback: RunCallback) {
		assert(IS_SERVER, "CommanderServer can only be started from the server");
		assert(!this.started, "Commander has already been started");

		this.dispatcherInstance.init();
		this.registryInstance.init();
		await callback(this.registryInstance);
		this.registryInstance.freeze();
		this.started = true;
	}

	static registry() {
		this.assertAccess("registry");
		return this.registryInstance;
	}

	static dispatcher() {
		this.assertAccess("dispatcher");
		return this.dispatcherInstance;
	}

	private static assertAccess(name: string) {
		assert(IS_SERVER, `Server ${name} cannot be accessed from the server`);
		assert(this.started, "Commander has not been started yet");
	}
}
