import { Players } from "@rbxts/services";
import { CommandOptions, GroupOptions, Path } from "../shared";
import { BaseCommand, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { Remotes, SyncData } from "../shared/network";
import { ServerOptions } from "./types";

export class ServerRegistry extends BaseRegistry {
	private commandFilter: (path: Path, player: Player) => boolean = () => true;

	init(options: ServerOptions) {
		super.init(options);

		const filter = options.commandFilter;
		if (filter !== undefined) {
			this.commandFilter = filter;
		}

		Remotes.SyncStart.OnServerEvent.Connect((player) => {
			Remotes.SyncDispatch.FireClient(player, this.getSyncData(player));
		});
	}

	protected registerCommand(
		command: BaseCommand,
		group?: CommandGroup | undefined,
	) {
		super.registerCommand(command, group);
		for (const player of Players.GetPlayers()) {
			Remotes.SyncDispatch.FireClient(player, this.getSyncData(player));
		}
	}

	private getSyncData(player: Player): SyncData {
		const syncedCommands = new Map<string, CommandOptions>();
		for (const [pathString, command] of this.commands) {
			const path = Path.fromString(pathString);
			if (!this.commandFilter(path, player)) continue;

			syncedCommands.set(path.toString(), {
				...(command.options as CommandOptions),
			});
		}

		const syncedGroups = new Map<string, GroupOptions>();
		for (const [path, group] of this.groups) {
			syncedGroups.set(path, group.options);
		}

		return {
			commands: syncedCommands,
			groups: syncedGroups,
		};
	}
}
