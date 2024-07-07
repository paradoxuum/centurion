import { RunService } from "@rbxts/services";
import { CommandOptions, GroupOptions, ImmutableRegistryPath } from "../shared";
import { CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { ServerCommand } from "./command";
import { DEFAULT_CLIENT_OPTIONS } from "./options";
import { ClientOptions, ClientRemotes } from "./types";

export class ClientRegistry extends BaseRegistry {
	private options: ClientOptions = DEFAULT_CLIENT_OPTIONS;
	private initialSyncReceived = false;
	private syncedPaths = new Set<string>();
	private syncStart: ClientRemotes.SyncStart;
	private syncDispatch: ClientRemotes.SyncDispatch;
	private execute: ClientRemotes.Execute;

	init(options: ClientOptions) {
		super.init(options);
		this.options = options;

		assert(
			this.options.network !== undefined,
			"Client options must include network options",
		);
		this.syncStart = this.options.network.syncStart;
		this.syncDispatch = this.options.network.syncDispatch;
		this.execute = this.options.network.execute;
	}

	/**
	 * Begins registry synchronisation to the server.
	 *
	 * @throws Throws an error if the server does not respond in time
	 *
	 * @returns A promise that will be resolved when the initial sync is received
	 */
	async sync() {
		this.syncDispatch.Connect((data) => {
			if (!this.initialSyncReceived) this.initialSyncReceived = true;

			for (const path of this.syncedPaths) {
				data.commands.delete(path);
				data.groups.delete(path);
			}

			const groups: GroupOptions[] = [];
			for (const [_, group] of data.groups) {
				groups.push(group);
			}

			this.registerGroup(...groups);
			this.registerServerCommands(data.commands);

			for (const [path] of data.commands) {
				this.syncedPaths.add(path);
			}

			for (const [path] of data.groups) {
				this.syncedPaths.add(path);
			}
		});

		this.syncStart.Fire();

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

	private registerServerCommands(commands: Map<string, CommandOptions>) {
		for (const [pathString, options] of commands) {
			const path = ImmutableRegistryPath.fromString(pathString);
			let group: CommandGroup | undefined;
			if (path.size() > 1) {
				const groupPath = path.remove(path.size() - 1);
				group = this.getGroup(groupPath);
				assert(
					group !== undefined,
					`Group '${groupPath}' for server command '${path}' is not registered`,
				);
			}

			if (this.commands.has(pathString)) {
				// TODO Implement shared command support:
				// - Verify that the argument options are the same
				// - Use the client command's return value to determine whether the
				//   server command should be executed
				// - Maybe log a warning if the description is different on the client
				warn(`Skipping shared command ${path}`);
				continue;
			}

			this.registerCommand(
				ServerCommand.create(this, path, options, this.execute),
				group,
			);
		}
	}
}
