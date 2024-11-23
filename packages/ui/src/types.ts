import { CommandShortcut, HistoryEntry } from "@rbxts/centurion";
import { Derivable } from "@rbxts/vide";
import { ScaleFunction } from "./hooks/use-px";
import { InterfacePalette } from "./palette";

export interface InterfaceOptions {
	anchor: Derivable<Vector2>;
	position: Derivable<UDim2>;
	size: Derivable<UDim2>;
	displayOrder: Derivable<number>;
	backgroundTransparency: Derivable<number>;
	hideOnLostFocus: Derivable<boolean>;
	activationKeys: Derivable<Enum.KeyCode[]>;
	font: Derivable<{
		regular: Font;
		medium: Font;
		bold: Font;
	}>;
	palette: Derivable<InterfacePalette>;
	autoLocalize: Derivable<boolean>;
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
