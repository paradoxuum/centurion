import { CommandOptions, GroupOptions } from "../shared";
import { SharedOptions } from "../shared/options";

export interface ClientOptions extends SharedOptions {
	historyLength: number;
	interface?: () => void;
}

export interface HistoryEntry {
	text: string;
	success: boolean;
	sentAt: number;
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
