import { RunService } from "@rbxts/services";
import { RunCallback } from "../shared/core/types";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { AppData, ClientOptions } from "./types";

const IS_CLIENT = RunService.IsClient();

export class CmdxClient {
	private static started = false;
	private static readonly registryInstance = new ClientRegistry();
	private static readonly dispatcherInstance = new ClientDispatcher(CmdxClient.registryInstance);

	static async run(callback: RunCallback, options: ClientOptions = DEFAULT_OPTIONS) {
		assert(IS_CLIENT, "CmdxClient can only be started from the client");
		assert(!this.started, "Cmdx has already been started");

		this.registryInstance.init();
		this.dispatcherInstance.init(options);
		callback(this.registryInstance);
		await this.registryInstance.sync();
		this.registryInstance.freeze();

		if (options.app !== undefined) {
			options.app(this.getAppData(options));
		}

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

	private static getAppData(options: ClientOptions): AppData {
		return {
			options,
			commands: this.registryInstance.getCommandOptions(),
			groups: this.registryInstance.getGroupOptions(),
			history: this.dispatcherInstance.getHistory(),
			onHistoryChanged: this.dispatcherInstance.getHistorySignal(),
			getArgumentSuggestions: () => [],
			getCommandSuggestions: () => [],
		};
	}
}
