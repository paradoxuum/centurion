import { ReadonlyDeepObject } from "@rbxts/sift/out/Util";
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
			this.registerSharedGroups(data.groups);
			this.registerSharedCommands(data.commands);
		});
	}

	getRegistryData() {
		const commandMap = new Map<string, ReadonlyDeepObject<CommandOptions>>();
		const groupMap = new Map<string, ReadonlyDeepObject<GroupOptions>>();

		for (const [k, v] of this.commands) {
			commandMap.set(k, v.options);
		}

		for (const [k, v] of this.groups) {
			groupMap.set(k, v.options);
		}
	}

	private registerSharedGroups(sharedGroups: GroupOptions[]) {
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

	private registerSharedCommands(commands: Map<string, CommandOptions>) {
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
