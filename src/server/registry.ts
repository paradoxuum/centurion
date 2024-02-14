import { Players } from "@rbxts/services";
import { ArgumentOptions, CommandOptions, Path } from "../shared";
import { CommandGroup, RegistrationData } from "../shared/core/command";
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
		data: RegistrationData,
		group?: CommandGroup | undefined,
	) {
		const command = super.registerCommand(data, group);
		for (const player of Players.GetPlayers()) {
			Remotes.SyncDispatch.FireClient(player, this.getSyncData(player));
		}
		return command;
	}

	private getSyncData(player: Player): SyncData {
		const syncedCommands = new Map<string, CommandOptions>();
		for (const [pathString, command] of this.commands) {
			const path = Path.fromString(pathString);
			if (!this.commandFilter(path, player)) continue;

			syncedCommands.set(path.toString(), {
				name: command.options.name,
				aliases: command.options.aliases as string[] | undefined,
				arguments: command.options.arguments as ArgumentOptions[] | undefined,
			});
		}

		return {
			commands: syncedCommands,
			groups: this.getGroups().map((group) => group.options),
		};
	}
}
