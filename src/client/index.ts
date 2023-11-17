import { RunService } from "@rbxts/services";
import { CommandPath } from "../shared";
import { RunCallback } from "../shared/core/types";
import { ClientDispatcher } from "./dispatcher";
import { DEFAULT_OPTIONS } from "./options";
import { ClientRegistry } from "./registry";
import { AppData, ArgumentSuggestion, ClientOptions, CommandSuggestion } from "./types";

const IS_CLIENT = RunService.IsClient();

export class CmdxClient {
	private static started = false;
	private static readonly registryInstance = new ClientRegistry();
	private static readonly dispatcherInstance = new ClientDispatcher(CmdxClient.registryInstance);
	private static optionsObject = DEFAULT_OPTIONS;

	static async run(callback: RunCallback, options: ClientOptions = DEFAULT_OPTIONS) {
		assert(IS_CLIENT, "CmdxClient can only be started from the client");
		assert(!this.started, "Cmdx has already been started");

		this.optionsObject = options;

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
		assert(IS_CLIENT, "Cannot access client registry from the server");
		assert(this.started, "Cmdx has not been started yet");
		return this.registryInstance;
	}

	static dispatcher() {
		assert(IS_CLIENT, "Cannot access client dispatcher from the server");
		assert(this.started, "Cmdx has not been started yet");
		return this.dispatcherInstance;
	}

	static options() {
		assert(IS_CLIENT, "Cannot access client options from the server");
		assert(this.started, "Cmdx has not been started yet");
		return this.optionsObject;
	}

	private static getSuggestionData(path: CommandPath): CommandSuggestion {
		const data = this.registryInstance.getCommand(path)?.options ?? this.registryInstance.getGroup(path)?.options;
		assert(data !== undefined, `Invalid command path: ${path}`);

		return {
			type: "command",
			title: data.name,
			description: data.description,
		};
	}

	private static getArgumentSuggestions(path: CommandPath, index: number): ArgumentSuggestion[] {
		const command = this.registryInstance.getCommand(path);
		if (command === undefined) {
			return [];
		}

		const args = command.options.arguments;
		if (args === undefined || args.isEmpty() || index >= args.size()) {
			return [];
		}

		const arg = args[index];
		return [
			{
				type: "argument",
				title: arg.name,
				description: arg.description,
				dataType: arg.type,
				optional: arg.optional === true,
			},
		];
	}

	private static getCommandSuggestions(path?: CommandPath, text?: string) {
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

	private static getAppData(): AppData {
		return {
			options: this.optionsObject,
			execute: (path, text) => this.dispatcherInstance.run(path, text),

			commands: this.registryInstance.getCommandOptions(),
			groups: this.registryInstance.getGroupOptions(),
			getArgumentSuggestions: (path, index) => this.getArgumentSuggestions(path, index),
			getCommandSuggestions: (path, text) => this.getCommandSuggestions(path, text),
			history: this.dispatcherInstance.getHistory(),
			onHistoryUpdated: this.dispatcherInstance.getHistorySignal(),
		};
	}
}
