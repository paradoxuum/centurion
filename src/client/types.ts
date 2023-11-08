import { CommandOptions, GroupOptions } from "../shared";

export interface RunOptions {
	app: CmdxApp;
}

export type RunCommandCallback = (path: string, text: string) => void;

export interface CmdxAppData {
	// Path -> Group/Command
	commands: Map<string, CommandOptions>;
	groups: Map<string, GroupOptions>;
}

export interface CmdxApp {
	start: (data: CmdxAppData) => void;
	execute: RBXScriptSignal<(path: string, text: string) => void>;
}
