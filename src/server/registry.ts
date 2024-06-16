import { Players } from "@rbxts/services";
import { CommandOptions, GroupOptions } from "../shared";
import { BaseCommand, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { SyncData } from "../shared/network";
import { DEFAULT_SERVER_OPTIONS } from "./options";
import { ServerOptions, ServerRemotes } from "./types";

export class ServerRegistry extends BaseRegistry {
	private options = DEFAULT_SERVER_OPTIONS;
	private syncStart: ServerRemotes.SyncStart;
	private syncDispatch: ServerRemotes.SyncDispatch;

	init(options: ServerOptions) {
		super.init(options);
		this.options = options;

		assert(
			options.network !== undefined,
			"Server options must include network options",
		);
		this.syncStart = options.network.syncStart;
		this.syncDispatch = options.network.syncDispatch;
		this.syncStart.Connect((player) => {
			this.syncDispatch.Fire(player, this.getSyncData(player));
		});
	}

	protected registerCommand(
		command: BaseCommand,
		group?: CommandGroup | undefined,
	) {
		super.registerCommand(command, group);
		for (const player of Players.GetPlayers()) {
			this.syncDispatch.Fire(player, this.getSyncData(player));
		}
	}

	private getSyncData(player: Player): SyncData {
		const syncedCommands = new Map<string, CommandOptions>();
		const commandFilter = this.options.commandFilter ?? (() => true);
		for (const [_, command] of this.commands) {
			const path = command.getPath();
			if (syncedCommands.has(path.toString())) continue;
			if (!commandFilter(path, player)) continue;

			syncedCommands.set(path.toString(), {
				...(command.options as CommandOptions),
			});
		}

		const syncedGroups = new Map<string, GroupOptions>();
		for (const [path, group] of this.groups) {
			syncedGroups.set(path, {
				...(group.options as GroupOptions),
			});
		}

		return {
			commands: syncedCommands,
			groups: syncedGroups,
		};
	}
}
