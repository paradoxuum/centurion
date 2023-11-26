import { CommandPath } from "../../shared";
import { HistoryEntry } from "../types";

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
}

export interface Suggestion {
	main: ArgumentSuggestion | CommandSuggestion;
	others: string[];
}

export interface ArgumentSuggestionQuery {
	type: "argument";
	commandPath: CommandPath;
	text?: string;
	index: number;
}

export interface CommandSuggestionQuery {
	type: "command";
	parentPath?: CommandPath;
	text?: string;
}

export type SuggestionQuery = ArgumentSuggestionQuery | CommandSuggestionQuery;
