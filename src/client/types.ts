import { CommandOptions, CommandPath, GroupOptions } from "../shared";

export interface ClientOptions {
	historyLength?: number;
	app?: (data: AppData) => void;
}

export interface AppData {
	options: ClientOptions;
	commands: Map<string, CommandOptions>;
	groups: Map<string, GroupOptions>;
	history: HistoryEntry[];
	onHistoryChanged: RBXScriptSignal<(entry: HistoryEntry) => void>;
	getArgumentSuggestions: (path: CommandPath, index: number) => ArgumentSuggestion[];
	getCommandSuggestions: (text?: string, path?: CommandPath) => CommandSuggestion[];
}

export interface HistoryEntry {
	text: string;
	success: boolean;
	sentAt: number;
}

export interface CommandSuggestion {
	type: "command";
	title: string;
	description?: string;
}

export interface ArgumentSuggestion {
	type: "argument";
	title: string;
	description?: string;
	dataType: string;
	required: boolean;
}

export type Suggestion = CommandSuggestion | ArgumentSuggestion;
