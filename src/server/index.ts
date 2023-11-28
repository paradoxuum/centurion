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
		assert(IS_SERVER, "Cannot access server registry from the client");
		assert(this.started, "Commander has not been started yet");
		return this.registryInstance;
	}

	static dispatcher() {
		assert(IS_SERVER, "Cannot access server dispatcher from the client");
		assert(this.started, "Commander has not been started yet");
		return this.dispatcherInstance;
	}
}
