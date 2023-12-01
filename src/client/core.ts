import { RunService } from "@rbxts/services";
import { mergeDeep } from "@rbxts/sift/out/Dictionary";
import { RunCallback } from "../shared/core/types";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { AppData, ClientOptions } from "./types";

const IS_CLIENT = RunService.IsClient();

export class CommanderClient {
	private static started = false;
	private static readonly registryInstance = new ClientRegistry();
	private static readonly dispatcherInstance = new ClientDispatcher(CommanderClient.registryInstance);
	private static optionsObject = DEFAULT_OPTIONS;

	static async start(callback: RunCallback, options: ClientOptions = DEFAULT_OPTIONS) {
		assert(IS_CLIENT, "CommanderClient can only be started from the client");
		assert(!this.started, "Commander has already been started");

		this.optionsObject = mergeDeep(DEFAULT_OPTIONS, options);

		this.registryInstance.init();
		this.dispatcherInstance.init(options);

		callback(this.registryInstance);
		await this.registryInstance.sync();

		this.registryInstance.freeze();
		this.started = true;

		if (options.app !== undefined) {
			options.app(this.getAppData());
		}
	}

	static registry() {
		this.assertAccess("registry");
		return this.registryInstance;
	}

	static dispatcher() {
		this.assertAccess("dispatcher");
		return this.dispatcherInstance;
	}

	static options() {
		this.assertAccess("options");
		return this.optionsObject;
	}

	private static getAppData(): AppData {
		return {
			options: this.optionsObject,
			execute: (path, text) => this.dispatcherInstance.run(path, text),
			commands: this.registryInstance.getCommandOptions(),
			groups: this.registryInstance.getGroupOptions(),
			history: this.dispatcherInstance.getHistory(),
			onHistoryUpdated: this.dispatcherInstance.getHistorySignal(),
		};
	}

	private static assertAccess(name: string) {
		assert(IS_CLIENT, `Client ${name} cannot be accessed from the server`);
		assert(this.started, "Commander has not been started yet");
	}
}
