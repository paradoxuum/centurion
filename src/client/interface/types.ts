import { HistoryEntry } from "../types";

export interface AppOptions {
	anchorPoint?: Vector2;
	size?: UDim2;
	position?: UDim2;
	displayOrder?: number;
}

export interface HistoryLineData {
	entry: HistoryEntry;
	height: number;
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
	error?: string;
}

export interface Suggestion {
	main: ArgumentSuggestion | CommandSuggestion;
	others: string[];
}
