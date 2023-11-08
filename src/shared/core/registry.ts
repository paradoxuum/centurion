import { CmdxOptions, GroupOptions, TypeOptions } from "../types";
import { Reflect } from "../util/reflect";
import { BaseCommand, CommandData, CommandGroup, ExecutableCommand } from "./command";
import { MetadataKey } from "./decorators";
import { CommandPath, ImmutableCommandPath } from "./path";

export abstract class BaseRegistry {
	protected readonly commands = new Map<string, BaseCommand>();
	protected readonly groups = new Map<string, CommandGroup>();
	protected readonly types = new Map<string, TypeOptions<defined>>();
	protected readonly registeredObjects = new Set<object>();
	protected frozen = false;

	init() {
		const builtInTypes = script.Parent?.FindFirstChild("builtin")?.FindFirstChild("types");
		assert(builtInTypes !== undefined, "Built-in type container does not exist");
		this.registerContainer(builtInTypes);
	}

	freeze() {
		this.frozen = true;
	}

	registerType<T extends defined>(typeOptions: TypeOptions<T>) {
		assert(!this.frozen, "Registry frozen");
		this.types.set(typeOptions.name, typeOptions);
	}

	registerTypes<T extends defined>(...types: TypeOptions<T>[]) {
		assert(!this.frozen, "Registry frozen");
		for (const options of types) {
			this.registerType(options);
		}
	}

	registerContainer(container: Instance) {
		assert(!this.frozen, "Registry frozen");
		for (const obj of container.GetChildren()) {
			if (!obj.IsA("ModuleScript")) {
				continue;
			}

			const objValue = require(obj);
			if (!typeIs(objValue, "function")) {
				return;
			}

			objValue(this);
		}
	}

	getType(name: string) {
		return this.types.get(name);
	}

	registerCommandsIn(container: Instance) {
		assert(!this.frozen, "Registry frozen");
		for (const obj of container.GetChildren()) {
			if (!obj.IsA("ModuleScript")) {
				return;
			}

			require(obj);
		}

		for (const [commandHolder] of Reflect.metadata) {
			if (this.registeredObjects.has(commandHolder)) {
				continue;
			}

			this.registeredObjects.add(commandHolder);
			this.registerCommandHolder(commandHolder);
		}
	}

	getCommand(path: CommandPath) {
		return this.commands.get(path.toString());
	}

	getGroup(path: CommandPath) {
		assert(path.getSize() < 3, `Invalid group path '${path}', a group path has a maximum of 2 parts`);

		const root = this.groups.get(path.getPart(0));
		if (path.getSize() === 1 || root === undefined) {
			return root;
		}

		return root.getGroup(path.getPart(1));
	}

	protected registerCommand(commandData: CommandData, group?: CommandGroup) {
		const options = commandData.metadata.options;
		const path =
			group !== undefined ? group.getPath().append(options.name) : new ImmutableCommandPath([options.name]);

		assert(!this.commands.has(path.toString()), `A command with the path '${path}' is already registered`);

		const command = ExecutableCommand.create(this, ImmutableCommandPath.fromPath(path), commandData.metadata, [
			...commandData.guards,
		]);

		this.commands.set(path.toString(), command);

		if (group !== undefined) {
			group.addCommand(command);
		}
	}

	private registerCommandHolder(commandHolder: object) {
		const holderOptions = Reflect.getOwnMetadata<CmdxOptions>(commandHolder, MetadataKey.CommandHolder);
		const globalGroups = holderOptions?.globalGroups ?? [];
		if (holderOptions?.groups !== undefined) {
			this.registerCommandGroups(holderOptions.groups);
		}

		for (const command of Reflect.getOwnProperties(commandHolder)) {
			const data = CommandData.fromHolder(commandHolder, command);

			// Get registered command group
			let commandGroup: CommandGroup | undefined;
			if (data.group.size() > 0) {
				const groupPath = new CommandPath([...globalGroups, ...data.group]);

				if (groupPath.getSize() > 2) {
					throw `Invalid group for command '${command}': a command can only have 2 groups, found ${groupPath.getSize()}`;
				}

				commandGroup = this.getGroup(groupPath);
				assert(
					commandGroup !== undefined,
					`The group '${groupPath}' assigned to command '${command}' is invalid`,
				);
			}

			this.registerCommand(data, commandGroup);
		}
	}

	protected registerCommandGroups(groups: GroupOptions[]) {
		const childGroups: GroupOptions[] = [];
		for (const group of groups) {
			if (group.root !== undefined) {
				childGroups.push(group);
				continue;
			}

			assert(!this.groups.has(group.name), `Duplicate group: ${group.name}`);
			const groupObject = this.createGroup(group);
			this.groups.set(groupObject.path.toString(), groupObject);
		}

		for (const group of childGroups) {
			const rootGroup = this.groups.get(group.root!);
			assert(rootGroup !== undefined, `Parent group '${group.root!}' does not exist for group '${group.name}'`);
			assert(
				!rootGroup.hasGroup(group.name),
				`Duplicate group found in parent group '${rootGroup.options.name}': ${group.name}`,
			);

			const groupObject = this.createGroup(group);
			this.groups.set(groupObject.path.toString(), groupObject);
			rootGroup.addGroup(groupObject);
		}
	}

	protected createGroup(group: GroupOptions) {
		const groupParts: string[] = [];
		if (group.root !== undefined) {
			groupParts.push(group.root);
		}

		groupParts.push(group.name);
		return new CommandGroup(new ImmutableCommandPath(groupParts), group);
	}
}
