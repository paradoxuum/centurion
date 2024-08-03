import { Players } from "@rbxts/services";
import { CommandOptions, GroupOptions } from "../shared";
import { BaseCommand, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { SyncData } from "../shared/network";
import { ArrayUtil, ReadonlyDeep } from "../shared/util/data";
import { ServerConfig } from "./types";

export class ServerRegistry extends BaseRegistry<ReadonlyDeep<ServerConfig>> {
	/**
	 * Initializes the server registry.
	 *
	 * @param options Server options
	 * @ignore
	 */
	init() {
		super.init();
		this.config.network.syncStart.Connect((player) => {
			const data = this.getSyncData(player);
			this.logger.debug(`Syncing data to ${player.Name}`, data);
			this.config.network.syncDispatch.Fire(player, data);
		});
	}

	protected addCommand(command: BaseCommand, group?: CommandGroup | undefined) {
		super.addCommand(command, group);

		const dispatch = this.config.network.syncDispatch;
		for (const player of Players.GetPlayers()) {
			dispatch.Fire(player, this.getSyncData(player));
		}
	}

	private getSyncData(player: Player): SyncData {
		const syncedCommands = new Map<string, CommandOptions>();
		for (const [_, command] of this.commands) {
			const path = command.getPath();
			if (syncedCommands.has(path.toString())) continue;
			if (!this.config.syncFilter(player, command)) continue;

			syncedCommands.set(path.toString(), {
				...(command.options as CommandOptions),
			});
		}

		const syncedGroups = new Map<string, GroupOptions>();
		for (const [path] of syncedCommands) {
			const parts = path.split("/");
			if (parts.size() === 1) continue;

			let groupPath = "";
			for (const part of ArrayUtil.slice(parts, 0, parts.size() - 1)) {
				groupPath += part;
				const group = this.getGroupByString(groupPath);
				if (group === undefined) break;
				syncedGroups.set(groupPath, { ...(group.options as GroupOptions) });
				groupPath += "/";
			}
		}

		return {
			commands: syncedCommands,
			groups: syncedGroups,
		};
	}
}
