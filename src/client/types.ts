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
	history: HistoryEntry[];
	onHistoryUpdated: RBXScriptSignal<(entry: HistoryEntry) => void>;
}

export interface HistoryEntry {
	text: string;
	success: boolean;
	sentAt: number;
}
