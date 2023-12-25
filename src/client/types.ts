import { CommandOptions, CommandPath, GroupOptions } from "../shared";

export interface ClientOptions {
	historyLength?: number;
	activationKeys?: Enum.KeyCode[];
	app?: (data: AppContext) => void;
}

export interface CommanderEvents {
	historyUpdated: BindableEvent<(history: HistoryEntry[]) => void>;
	commandAdded: BindableEvent<(key: string, command: CommandOptions) => void>;
	groupAdded: BindableEvent<(key: string, group: GroupOptions) => void>;
}

export type CommanderEventCallbacks = {
	[K in keyof CommanderEvents]: CommanderEvents[K] extends BindableEvent<
		infer R
	>
		? RBXScriptSignal<R>
		: never;
};

export type AppContext = {
	options: ClientOptions;
	execute: (path: CommandPath, text: string) => Promise<HistoryEntry>;
	addHistoryEntry: (entry: HistoryEntry) => void;
	initialData: {
		commands: Map<string, CommandOptions>;
		groups: Map<string, GroupOptions>;
		history: HistoryEntry[];
	};
	events: CommanderEventCallbacks;
};

export interface HistoryEntry {
	text: string;
	success: boolean;
	sentAt: number;
}
