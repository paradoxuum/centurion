export interface AppData {
	history: HistoryEntry[];
	getCommandSuggestions: (text: string) => CommandSuggestion[];
	getArgumentSuggestions: (command: string, index: number) => ArgumentSuggestion[];
}

export interface HistoryEntry {
	text: string;
	sentAt: number;
}

export interface CommandSuggestion {
	type: "command";
	title: string;
	description: string;
}

export interface ArgumentSuggestion {
	type: "argument";
	title: string;
	description: string;
	dataType: string;
	required: boolean;
}

export type Suggestion = CommandSuggestion | ArgumentSuggestion;
