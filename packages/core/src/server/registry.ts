import { Players } from "@rbxts/services";
import {
	CenturionLogLevel,
	CommandOptions,
	GroupOptions,
	RegistryPath,
} from "../shared";
import {
	BaseCommand,
	CommandGroup,
	ExecutableCommand,
} from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { SyncData } from "../shared/network";
import { ArrayUtil, ReadonlyDeep } from "../shared/util/data";
import { inspect } from "../shared/util/inspect";
import { ServerConfig } from "./types";

export class ServerRegistry extends BaseRegistry<ReadonlyDeep<ServerConfig>> {
	private syncedCommands = new Map<Player, Set<string>>();
	private initialized = false;

	/**
	 * Initializes the server registry.
	 *
	 * @param options Server options
	 * @internal
	 * @ignore
	 */
	init() {
		super.init();

		Players.PlayerRemoving.Connect((player) => {
			this.syncedCommands.delete(player);
		});

		this.config.network.syncStart.Connect((player) => {
			this.sync(player);
		});

		this.initialized = true;
	}

	isCommandSynced(player: Player, path: RegistryPath) {
		const syncedCommands = this.syncedCommands.get(player);
		if (syncedCommands === undefined) return false;
		return syncedCommands.has(path.toString());
	}

	sync(player: Player) {
		if (!this.initialized) return;

		const data = {
			commands: new Map(),
			groups: new Map(),
		} satisfies SyncData;

		const syncedCommands = new Set<string>();
		for (const [_, command] of this.commands) {
			const path = command.getPath();
			if (data.commands.has(path.toString())) continue;
			if (!this.config.syncFilter(player, command as ExecutableCommand)) {
				continue;
			}

			syncedCommands.add(path.toString());
			data.commands.set(path.toString(), {
				...(command.options as CommandOptions),
			});
		}
		this.syncedCommands.set(player, syncedCommands);

		for (const [path] of data.commands) {
			const parts = path.split("/");
			if (parts.size() === 1) continue;

			let groupPath = "";
			for (const part of ArrayUtil.slice(parts, 0, parts.size() - 1)) {
				groupPath += part;

				const group = this.getGroupByString(groupPath);
				if (group === undefined) break;
				data.groups.set(groupPath, { ...(group.options as GroupOptions) });
				groupPath += "/";
			}
		}

		this.config.network.syncDispatch.Fire(player, data);
		if (this.logger.level <= CenturionLogLevel.Debug) {
			this.logger.debug(
				`Synced data to ${player.Name}`,
				inspect(data, {
					depth: 2,
				}),
			);
		}
	}

	protected addCommand(command: BaseCommand, group?: CommandGroup | undefined) {
		super.addCommand(command, group);
		for (const [player] of this.syncedCommands) {
			this.sync(player);
		}
	}
}
