import { RunService } from "@rbxts/services";
import { CommandPath } from "../shared";
import { RunCallback } from "../shared/core/types";
import { ClientDispatcher } from "./dispatcher";
import { ClientRegistry } from "./registry";
import { RunOptions } from "./types";

const IS_CLIENT = RunService.IsClient();

export class CmdxClient {
	private static started = false;
	private static readonly registryInstance = new ClientRegistry();
	private static readonly dispatcherInstance = new ClientDispatcher(CmdxClient.registryInstance);

	static run(callback: RunCallback, options: RunOptions) {
		assert(IS_CLIENT, "CmdxClient can only be started from the client");
		assert(!this.started, "Cmdx has already been started");

		this.registryInstance.init();
		callback(this.registryInstance);
		this.registryInstance.freeze();

		options.app.execute.Connect((path, text) => {
			this.dispatcherInstance.run(CommandPath.fromString(path), text);
		});

		// Get app data
		options.app.start({
			commands: new Map(),
			groups: new Map(),
		});

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
