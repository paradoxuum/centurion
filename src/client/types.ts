import { BaseCommand, CommandGroup } from "../shared/core/command";
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
	commandAdded: BindableEvent<(key: string, command: BaseCommand) => void>;
	groupAdded: BindableEvent<(key: string, group: CommandGroup) => void>;
}

export type CommanderEventCallbacks = {
	[K in keyof CommanderEvents]: CommanderEvents[K] extends BindableEvent<
		infer R
	>
		? RBXScriptSignal<R>
		: never;
};
