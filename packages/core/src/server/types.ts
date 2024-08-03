import { CommandContextData, SharedConfig } from "../shared";
import { BaseCommand } from "../shared/core/command";
import { SyncData } from "../shared/network";

export interface ServerConfig extends SharedConfig {
	network: ServerNetworkConfig;
	syncFilter: (player: Player, command: BaseCommand) => boolean;
}

export interface ServerNetworkConfig {
	syncStart: ServerRemotes.SyncStart;
	syncDispatch: ServerRemotes.SyncDispatch;
	execute: ServerRemotes.Execute;
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
