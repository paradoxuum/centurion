import { copyDeep } from "@rbxts/sift/out/Dictionary";
import { CommandOptions, GroupOptions, ImmutableCommandPath } from "../shared";
import { BaseCommand, CommandGroup } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { remotes } from "../shared/network";
import { ServerCommand } from "./command";

export class ClientRegistry extends BaseRegistry {
	async init() {
		super.init();
		remotes.sync.start.fire();
		remotes.sync.dispatch.connect((data) => {
			this.registerServerGroups(data.groups);
			this.registerServerCommands(data.commands);
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
		for (const [k, v] of this.commands) {
			groupMap.set(k, copyDeep(v.options as CommandOptions));
		}
		return groupMap;
	}

	private registerServerGroups(sharedGroups: GroupOptions[]) {
		const childGroups: GroupOptions[] = [];
		for (const group of sharedGroups) {
			if (group.root !== undefined) {
				childGroups.push(group);
				continue;
			}

			if (this.groups.has(group.name)) {
				continue;
			}

			this.groups.set(group.name, this.createGroup(group));
		}

		for (const group of childGroups) {
			const rootGroup = this.groups.get(group.name);
			assert(rootGroup !== undefined, `Parent group '${group.root!}' does not exist for group '${group.name}'`);

			if (rootGroup.hasGroup(group.name)) {
				continue;
			}

			rootGroup.addGroup(this.createGroup(group));
		}
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

			let commandObject: BaseCommand;
			if (this.commands.has(path)) {
				// TODO Implement shared command support:
				// - Verify that the argument options are the same
				// - Use the client command's return value to determine whether the
				//   server command should be executed
				// - Maybe log a warning if the description is different on the client
				warn(`Skipping shared command ${commandPath}`);
				continue;
			} else {
				commandObject = ServerCommand.create(this, commandPath, command);
			}

			this.commands.set(path, commandObject);
		}
	}
}
