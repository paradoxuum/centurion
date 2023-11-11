export interface AppData {
	history: HistoryEntry[];
	getCommandSuggestions: (text: string) => SuggestionData[];
	getArgumentSuggestions: (text: string) => SuggestionData[];
}

export interface SuggestionData {
	title: string;
	description?: string;
}

export interface HistoryEntry {
	text: string;
	sentAt: number;
}
