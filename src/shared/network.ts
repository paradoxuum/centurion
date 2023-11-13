import { Client, Server, createRemotes, namespace, remote } from "@rbxts/remo";
import { t } from "@rbxts/t";
import { CommandInteractionData, CommandOptions, GroupOptions } from "./types";

export interface SyncData {
	commands: Map<string, CommandOptions>;
	groups: GroupOptions[];
}

export const remotes = createRemotes({
	sync: namespace({
		start: remote<Server>(),
		dispatch: remote<Client, [data: SyncData]>(),
	}),

	executeCommand: remote<Server, [path: string, text: string]>(t.string, t.string).returns<CommandInteractionData>(),
});
