import { RunService } from "@rbxts/services";
import { CommandPath } from "../shared";
import { RunCallback } from "../shared/core/types";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { AppData, ClientOptions, CommandSuggestion } from "./types";

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

	private static getSuggestionData(path: CommandPath): CommandSuggestion {
		const options =
			this.registryInstance.getCommand(path)?.options ?? this.registryInstance.getGroup(path)?.options;
		assert(options !== undefined, `Invalid command path: ${path}`);

		return {
			type: "command",
			title: options.name,
			description: options.description,
		};
	}

	private static getCommandSuggestions(text?: string, path?: CommandPath) {
		const childPaths = this.registryInstance.getChildPaths(path);
		if (text === undefined) {
			return childPaths.map((childPath) => this.getSuggestionData(childPath));
		}

		const results: CommandSuggestion[] = [];
		const textLower = text.lower();
		const textSubIndex = text.size();
		for (const childPath of childPaths) {
			const pathNameLower = childPath.getTail().lower();
			if (pathNameLower.sub(0, textSubIndex) !== textLower) {
				continue;
			}

			results.push(this.getSuggestionData(childPath));
		}

		return results;
	}

	private static getAppData(options: ClientOptions): AppData {
		return {
			options,
			commands: this.registryInstance.getCommandOptions(),
			groups: this.registryInstance.getGroupOptions(),
			history: this.dispatcherInstance.getHistory(),
			onHistoryChanged: this.dispatcherInstance.getHistorySignal(),
			getArgumentSuggestions: () => [],
			getCommandSuggestions: (text, path) => this.getCommandSuggestions(text, path),
		};
	}
}
