import { CommandContextData, SharedConfig } from "../shared";
import { SyncData } from "../shared/network";

export interface ClientConfig extends SharedConfig {
	historyLength: number;
	registerBuiltInCommands: boolean;
	shortcutsEnabled: boolean;
	syncTimeout: number;
	network: ClientNetworkConfig;
}

export interface ClientNetworkConfig {
	syncStart: ClientRemotes.SyncStart;
	syncDispatch: ClientRemotes.SyncDispatch;
	execute: ClientRemotes.Execute;
}

export interface HistoryEntry {
	text: string;
	success: boolean;
	sentAt: number;
}

export namespace ClientRemotes {
	export interface SyncStart {
		Fire: () => void;
	}

	export interface SyncDispatch {
		Connect: (callback: (data: SyncData) => void) => void;
	}

	export interface Execute {
		Invoke: (path: string, args: string[]) => CommandContextData;
	}
}
