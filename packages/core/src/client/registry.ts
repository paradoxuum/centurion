import { RunService } from "@rbxts/services";
import { CommandOptions, GroupOptions, ImmutableRegistryPath } from "../shared";
import { CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { CenturionLogLevel } from "../shared/util/log";
import { ServerCommand } from "./command";
import { ClientConfig } from "./types";

export class ClientRegistry extends BaseRegistry<ClientConfig> {
	private initialSyncReceived = false;
	private syncedPaths = new Set<string>();

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
	 * @throws Throws an error if the server does not respond in time
	 *
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

			for (const path of this.syncedPaths) {
				data.commands.delete(path);
				data.groups.delete(path);
			}

			const groups: GroupOptions[] = [];
			for (const [_, group] of data.groups) {
				groups.push(group);
			}

			this.logger.debug(
				`Received sync data from server (commands: ${data.commands.size()}, groups: ${groups.size()})`,
			);
			this.registerGroup(...groups);
			this.registerServerCommands(data.commands);

			for (const [path] of data.commands) {
				this.syncedPaths.add(path);
			}

			for (const [path] of data.groups) {
				this.syncedPaths.add(path);
			}

			if (this.logger.level <= CenturionLogLevel.Info) {
				const commandCount = data.commands.size();
				const groupCount = groups.size();
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

	private registerServerCommands(commands: Map<string, CommandOptions>) {
		for (const [pathString, options] of commands) {
			const path = ImmutableRegistryPath.fromString(pathString);
			let group: CommandGroup | undefined;
			if (path.size() > 1) {
				const groupPath = path.remove(path.size() - 1);
				group = this.getGroup(groupPath);
				this.logger.assert(
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
				this.logger.warn(`Shared commands are not yet supported: ${path}`);
				continue;
			}

			this.addCommand(
				new ServerCommand(this.config, this, path, options),
				group,
			);
		}
	}
}
