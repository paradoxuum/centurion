import { CommandContextData, RegistryPath } from "../shared";
import { SyncData } from "../shared/network";
import { SharedOptions } from "../shared/options";

export interface ServerOptions extends SharedOptions {
	commandFilter?: (command: RegistryPath, player: Player) => boolean;
	network?: {
		syncStart: ServerRemotes.SyncStart;
		syncDispatch: ServerRemotes.SyncDispatch;
		execute: ServerRemotes.Execute;
	};
}

export namespace ServerRemotes {
	export interface SyncStart {
		Connect: (callback: (player: Player) => void) => RBXScriptConnection;
	}

	export interface SyncDispatch {
		Fire: (player: Player, data: SyncData) => void;
	}

	export interface Execute {
		SetCallback: (
			callback: (player: Player, ...args: Array<unknown>) => CommandContextData,
		) => void;
	}
}
