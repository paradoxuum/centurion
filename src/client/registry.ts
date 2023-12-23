import { RunService } from "@rbxts/services";
import { copyDeep } from "@rbxts/sift/out/Dictionary";
import { CommandOptions, GroupOptions, ImmutableCommandPath } from "../shared";
import { BaseCommand, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { remotes } from "../shared/network";
import { ServerCommand } from "./command";
import { CommanderEvents } from "./types";

export class ClientRegistry extends BaseRegistry {
	private initialSyncReceived = false;

	constructor(private readonly events: CommanderEvents) {
		super();
	}

	init() {
		this.registerBuiltInTypes();
	}

	async sync() {
		remotes.sync.dispatch.connect((data) => {
			if (!this.initialSyncReceived) this.initialSyncReceived = true;
			this.registerGroups(data.groups);
			this.registerServerCommands(data.commands);
		});
		remotes.sync.start.fire();

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

	getCommandOptions() {
		const commandMap = new Map<string, CommandOptions>();
		for (const [k, v] of this.commands) {
			commandMap.set(k, copyDeep(v.options as CommandOptions));
		}
		return commandMap;
	}

	getGroupOptions() {
		const groupMap = new Map<string, GroupOptions>();
		for (const [k, v] of this.groups) {
			groupMap.set(k, copyDeep(v.options as GroupOptions));
		}
		return groupMap;
	}

	protected updateCommandMap(key: string, command: BaseCommand): void {
		super.updateCommandMap(key, command);
		this.events.commandAdded.Fire(
			key,
			copyDeep(command.options as CommandOptions),
		);
	}

	protected updateGroupMap(key: string, group: CommandGroup): void {
		super.updateGroupMap(key, group);
		this.events.groupAdded.Fire(key, copyDeep(group.options as GroupOptions));
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
