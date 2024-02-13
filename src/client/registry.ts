import { RunService } from "@rbxts/services";
import { CommandOptions, GroupOptions, ImmutableCommandPath } from "../shared";
import { BaseCommand, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { Remotes } from "../shared/network";
import { ObjectUtil } from "../shared/util/data";
import { ServerCommand } from "./command";
import { CommanderEvents } from "./types";

export class ClientRegistry extends BaseRegistry {
	private initialSyncReceived = false;

	constructor(private readonly events: CommanderEvents) {
		super();
	}

	/**
	 * Begins registry synchronisation to the server.
	 *
	 * @throws Throws an error if the server does not respond in time
	 *
	 * @returns A promise that will be resolved when the initial sync is received
	 */
	async sync() {
		const syncedCommands = new Set<string>();
		const syncedGroups = new Set<string>();

		const getGroupKey = (group: GroupOptions) => {
			let groupName = group.name;
			if (group.root !== undefined) {
				groupName = `${group.root}/${groupName}`;
			}
			return groupName;
		};

		Remotes.SyncDispatch.OnClientEvent.Connect((data) => {
			if (!this.initialSyncReceived) this.initialSyncReceived = true;

			for (const [k] of data.commands) {
				if (!syncedCommands.has(k)) continue;
				data.commands.delete(k);
			}

			this.registerGroups(
				data.groups.filter((group) => !syncedGroups.has(getGroupKey(group))),
			);
			this.registerServerCommands(data.commands);

			for (const [k] of data.commands) {
				syncedCommands.add(k);
			}

			for (const group of data.groups) {
				syncedGroups.add(getGroupKey(group));
			}
		});

		Remotes.SyncStart.FireServer();

		return new Promise((resolve) => {
			// Wait until dispatch has been received
			while (!this.initialSyncReceived) RunService.Heartbeat.Wait();
			resolve(undefined);
		})
			.timeout(5)
			.catch(() => {
				throw "Server did not respond in time";
			});
	}

	protected updateCommandMap(key: string, command: BaseCommand): void {
		super.updateCommandMap(key, command);
		this.events.commandAdded.Fire(
			key,
			ObjectUtil.copyDeep(command.options as CommandOptions),
		);
	}

	protected updateGroupMap(key: string, group: CommandGroup): void {
		super.updateGroupMap(key, group);
		this.events.groupAdded.Fire(
			key,
			ObjectUtil.copyDeep(group.options as GroupOptions),
		);
	}

	private registerServerCommands(commands: Map<string, CommandOptions>) {
		for (const [path, command] of commands) {
			const commandPath = ImmutableCommandPath.fromString(path);
			let group: CommandGroup | undefined;
			if (commandPath.getSize() > 1) {
				const groupPath = commandPath.remove(commandPath.getSize() - 1);
				group = this.getGroup(groupPath);
				assert(
					group !== undefined,
					`Group '${groupPath}' for server command '${commandPath}' is not registered`,
				);
			}

			if (this.commands.has(path)) {
				// TODO Implement shared command support:
				// - Verify that the argument options are the same
				// - Use the client command's return value to determine whether the
				//   server command should be executed
				// - Maybe log a warning if the description is different on the client
				warn(`Skipping shared command ${commandPath}`);
				continue;
			}

			this.validatePath(path, true);
			this.cachePath(commandPath);
			this.updateCommandMap(
				path,
				ServerCommand.create(this, commandPath, command),
			);
		}
	}
}
