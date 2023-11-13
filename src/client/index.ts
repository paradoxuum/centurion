import { RunService } from "@rbxts/services";
import { RunCallback } from "../shared/core/types";
import { ClientDispatcher } from "./dispatcher";
import { ClientRegistry } from "./registry";

const IS_CLIENT = RunService.IsClient();

export class CmdxClient {
	private static started = false;
	private static readonly registryInstance = new ClientRegistry();
	private static readonly dispatcherInstance = new ClientDispatcher(CmdxClient.registryInstance);

	static async run(callback: RunCallback) {
		assert(IS_CLIENT, "CmdxClient can only be started from the client");
		assert(!this.started, "Cmdx has already been started");

		await this.registryInstance.init();
		callback(this.registryInstance);
		this.registryInstance.freeze();
		this.started = true;
	}

	static registry() {
		assert(IS_CLIENT, "Cannot access client registry from the server");
		assert(this.started, "Cmdx has not been started yet");
		return this.registryInstance;
	}

	static dispatcher() {
		assert(IS_CLIENT, "Cannot access client dispatcher from the server");
		assert(this.started, "Cmdx has not been started yet");
		return this.dispatcherInstance;
	}
}
