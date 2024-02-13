import { Players } from "@rbxts/services";
import { ArgumentOptions, CommandOptions, CommandPath } from "../shared";
import { CommandData, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { Remotes, SyncData } from "../shared/network";
import { ServerOptions } from "./types";

export class ServerRegistry extends BaseRegistry {
	private readonly syncMap = new Map<Player, CommandPath[]>();
	private commandFilter: (path: CommandPath, player: Player) => boolean = () =>
		true;

	init(options: ServerOptions) {
		super.init(options);

		const filter = options.commandFilter;
		if (filter !== undefined) {
			this.commandFilter = filter;
		}

		Remotes.SyncStart.OnServerEvent.Connect((player) => {
			const pathArray: CommandPath[] = [];
			for (const [_, command] of this.commands) {
				if (!this.commandFilter(command.getPath(), player)) continue;
				pathArray.push(command.getPath());
			}
			this.syncMap.set(player, pathArray);

			Remotes.SyncDispatch.FireClient(player, this.getSyncData(player));
		});

		Players.PlayerRemoving.Connect((player) => {
			this.syncMap.delete(player);
		});
	}

	protected registerCommand(
		commandData: CommandData,
		group?: CommandGroup | undefined,
	) {
		const command = super.registerCommand(commandData, group);

		const path = command.getPath();
		for (const player of Players.GetPlayers()) {
			if (!this.commandFilter(path, player)) continue;
			const pathArray = this.syncMap.get(player) ?? [];
			pathArray.push(path);
			this.syncMap.set(player, pathArray);

			Remotes.SyncDispatch.FireClient(player, this.getSyncData(player));
		}

		return command;
	}

	private getSyncData(player: Player): SyncData {
		const commandPaths = this.syncMap.get(player) ?? [];
		const rootGroupNames: string[] = [];

		const syncedCommands = new Map<string, CommandOptions>();
		for (const path of commandPaths) {
			const command = this.getCommand(path);
			if (command === undefined) continue;

			if (path.getSize() > 1) {
				rootGroupNames.push(path.getRoot());
			}

			const readonlyArgs = command.options.arguments;
			let args: ArgumentOptions[] | undefined;
			if (readonlyArgs !== undefined) {
				args = [];
				for (const arg of readonlyArgs) {
					args.push({
						...arg,
					});
				}
			}

			syncedCommands.set(path.toString(), {
				name: command.options.name,
				description: command.options.description,
				arguments: args,
			});
		}

		const rootGroups: CommandGroup[] = [];
		for (const name of rootGroupNames) {
			const group = this.groups.get(name);
			if (group === undefined) continue;
			rootGroups.push(group);
		}

		return {
			commands: syncedCommands,
			groups: this.getGroups().map((group) => group.options),
		};
	}
}
