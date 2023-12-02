import { Players, RunService } from "@rbxts/services";
import { ArgumentOptions, CommandOptions, GroupOptions } from "../shared";
import { CommandData, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { SyncData, remotes } from "../shared/network";

export class ServerRegistry extends BaseRegistry {
	private readonly syncedPlayers = new Set<Player>();
	private pendingSyncData?: SyncData;

	init() {
		super.init();
		this.notifySyncUpdate();

		remotes.sync.start.connect((player) => {
			const data = this.getSyncData();
			this.syncedPlayers.add(player);
			remotes.sync.dispatch.fire(player, data);
		});

		RunService.Heartbeat.Connect(() => {
			if (this.pendingSyncData === undefined) {
				return;
			}

			const data = this.pendingSyncData;
			this.pendingSyncData = undefined;
			for (const player of this.syncedPlayers) {
				remotes.sync.dispatch.fire(player, data);
			}
		});

		Players.PlayerRemoving.Connect((player) => {
			this.syncedPlayers.delete(player);
		});
	}

	protected registerCommand(
		commandData: CommandData,
		group?: CommandGroup | undefined,
	): void {
		super.registerCommand(commandData, group);
		this.notifySyncUpdate();
	}

	protected registerCommandGroups(groups: GroupOptions[]) {
		super.registerCommandGroups(groups);
		this.notifySyncUpdate();
	}

	private notifySyncUpdate() {
		this.pendingSyncData = this.getSyncData();
	}

	private getSyncData(): SyncData {
		const syncedCommands = new Map<string, CommandOptions>();
		for (const [k, v] of this.commands) {
			const readonlyArgs = v.options.arguments;
			let args: ArgumentOptions[] | undefined;
			if (readonlyArgs !== undefined) {
				args = [];
				for (const arg of readonlyArgs) {
					args.push({
						...arg,
					});
				}
			}

			syncedCommands.set(k, {
				name: v.options.name,
				description: v.options.description,
				arguments: args,
			});
		}

		const rootGroups: CommandGroup[] = [];
		for (const [_, v] of this.groups) {
			rootGroups.push(v);
		}

		const syncedGroups = this.getGroups(rootGroups);

		return {
			commands: syncedCommands,
			groups: syncedGroups,
		};
	}

	private getGroups(commandGroups: CommandGroup[]) {
		const groups: GroupOptions[] = [];

		for (const group of commandGroups) {
			groups.push(group.options);

			const childGroups = group.getGroups();
			if (childGroups.size() > 0) {
				for (const childGroup of this.getGroups(childGroups)) {
					groups.push(childGroup);
				}
			}
		}

		return groups;
	}
}
