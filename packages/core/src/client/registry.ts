import { Signal } from "@rbxts/beacon";
import { RunService } from "@rbxts/services";
import {
	CommandOptions,
	GroupOptions,
	ImmutableRegistryPath,
	RegistryPath,
} from "../shared";
import { CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { SyncData } from "../shared/network";
import { ObjectUtil, ReadonlyDeep } from "../shared/util/data";
import { inspect } from "../shared/util/inspect";
import { CenturionLogLevel } from "../shared/util/log";
import { ServerCommand } from "./command";
import { ClientConfig } from "./types";

export class ClientRegistry extends BaseRegistry<ReadonlyDeep<ClientConfig>> {
	private initialSyncReceived = false;
	private syncedCommands = new Set<string>();
	private syncedGroups = new Set<string>();
	readonly synced = new Signal<
		[synced: ReadonlyDeep<SyncData>, incoming: ReadonlyDeep<SyncData>]
	>();

	/**
	 * Initializes the client registry.
	 *
	 * @internal
	 * @ignore
	 */
	init() {
		super.init();
		if (this.config.registerBuiltInCommands) {
			const commands =
				script.Parent?.WaitForChild("builtin").WaitForChild("commands");
			this.logger.assert(
				commands !== undefined,
				"Failed to locate built-in commands",
			);
			this.load(commands);
		}
	}

	/**
	 * Begins registry synchronisation to the server.
	 *
	 * @internal
	 * @ignore
	 * @throws Throws an error if the server does not respond in time
	 * @returns A promise that will be resolved when the initial sync is received
	 */
	async sync() {
		let startTime = 0;
		this.config.network.syncDispatch.Connect((data) => {
			if (!this.initialSyncReceived) {
				this.logger.info(
					`Initial sync received in ${math.round((os.clock() - startTime) * 1000)}ms`,
				);
				this.initialSyncReceived = true;
			}

			const commandsToSync = table.clone(data.commands);
			const groupsToSync = table.clone(data.groups);

			for (const path of this.syncedCommands) {
				// If the command has already been synced, skip it
				if (data.commands.has(path)) {
					commandsToSync.delete(path);
					continue;
				}

				// Unregister the command if it is no longer synced
				this.syncedCommands.delete(path);
				if (this.commands.has(path)) {
					this.unregisterCommand(RegistryPath.fromString(path));
				}
			}

			for (const path of this.syncedGroups) {
				// If the group has already been synced, skip it
				if (data.groups.has(path)) {
					groupsToSync.delete(path);
					continue;
				}

				// Unregister the group if it is no longer synced
				this.syncedGroups.delete(path);
				if (this.groups.has(path)) {
					this.unregisterGroup(RegistryPath.fromString(path));
				}
			}

			const toSyncData: ReadonlyDeep<SyncData> = table.freeze({
				commands: commandsToSync,
				groups: groupsToSync,
			});

			ObjectUtil.freezeDeep(data);
			if (commandsToSync.isEmpty() && groupsToSync.isEmpty()) {
				this.logger.debug("No commands or groups to sync");
				this.synced.Fire(toSyncData, data);
				return;
			}

			const groupObjects: GroupOptions[] = [];
			for (const [_, group] of groupsToSync) {
				groupObjects.push(group);
			}

			if (this.logger.level <= CenturionLogLevel.Debug) {
				this.logger.debug(
					`Received sync data from server (commands: ${data.commands.size()}, groups: ${groupObjects.size()})`,
					inspect(data, {
						depth: 2,
					}),
				);
			}

			this.registerGroup(...groupObjects);
			for (const [path, options] of commandsToSync) {
				this.registerServerCommand(
					ImmutableRegistryPath.fromString(path),
					options,
				);
				this.syncedCommands.add(path);
			}

			for (const [path] of groupsToSync) {
				this.syncedGroups.add(path);
			}

			this.synced.Fire(toSyncData, data);
			if (this.logger.level <= CenturionLogLevel.Info) {
				const commandCount = data.commands.size();
				const groupCount = groupObjects.size();
				this.logger.info(
					`Registered ${commandCount} command${commandCount === 1 ? "" : "s"} and ${groupCount} group${groupCount === 1 ? "" : "s"} from the server!`,
				);
			}
		});

		startTime = os.clock();
		this.config.network.syncStart.Fire();

		return new Promise((resolve) => {
			while (!this.initialSyncReceived) RunService.Heartbeat.Wait();
			resolve(undefined);
		})
			.timeout(this.config.syncTimeout)
			.catch(() => {
				throw "Server did not respond in time";
			});
	}

	private registerServerCommand(
		path: ImmutableRegistryPath,
		options: CommandOptions,
	) {
		let group: CommandGroup | undefined;
		if (path.size() > 1) {
			const groupPath = path.remove(path.size() - 1);
			group = this.getGroup(groupPath);
			this.logger.assert(
				group !== undefined,
				`Group '${groupPath}' for server command '${path}' is not registered`,
			);
		}

		if (this.commands.has(path.toString())) {
			// TODO Implement shared command support:
			// - Verify that the argument options are the same
			// - Use the client command's return value to determine whether the
			//   server command should be executed
			// - Maybe log a warning if the description is different on the client
			this.logger.warn(`Shared commands are not yet supported: ${path}`);
			return;
		}

		this.addCommand(new ServerCommand(this.config, this, path, options), group);
	}
}
