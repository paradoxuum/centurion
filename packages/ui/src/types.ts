import { CommandShortcut, HistoryEntry } from "@rbxts/centurion";
import { InterfacePalette } from "./palette";

export interface InterfaceOptions {
	anchorPoint?: Vector2;
	size?: UDim2;
	position?: UDim2;
	backgroundTransparency?: number;
	displayOrder?: number;
	hideOnLostFocus: boolean;
	activationKeys: Enum.KeyCode[];
	font: {
		regular: Font;
		medium: Font;
		bold: Font;
	};
	palette: InterfacePalette;
	showShortcutSuggestions?: boolean;
}

export interface HistoryLineData {
	entry: HistoryEntry;
	height: number;
}

export interface HistoryData {
	lines: HistoryLineData[];
	height: number;
}

export interface CommandSuggestion {
	type: "command";
	title: string;
	others: string[];
	description?: string;
	shortcuts?: CommandShortcut[];
}

export interface ArgumentSuggestion {
	type: "argument";
	title: string;
	others: string[];
	description?: string;
	dataType: string;
	optional: boolean;
	error?: string;
}

export type Suggestion = CommandSuggestion | ArgumentSuggestion;
