import { CommandOptions, CommandPath, GroupOptions } from "../shared";

export interface ClientOptions {
	historyLength?: number;
	app?: (data: AppData) => void;
}

export interface AppData {
	options: ClientOptions;
	execute: (path: CommandPath, text: string) => Promise<HistoryEntry>;

	commands: Map<string, CommandOptions>;
	groups: Map<string, GroupOptions>;
	getArgumentSuggestions: (path: CommandPath) => ArgumentSuggestion[];
	getCommandSuggestions: (path?: CommandPath, text?: string) => CommandSuggestion[];
	history: HistoryEntry[];
	onHistoryUpdated: RBXScriptSignal<(entry: HistoryEntry) => void>;
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
	optional: boolean;
}

export type Suggestion = CommandSuggestion | ArgumentSuggestion;
