import { SharedOptions } from "../options";
import {
	CommandGuard,
	CommandMetadata,
	CommanderOptions,
	GroupOptions,
	TypeOptions,
} from "../types";
import { MetadataReflect } from "../util/reflect";
import { BaseCommand, CommandGroup, ExecutableCommand } from "./command";
import { MetadataKey } from "./decorators";
import { ImmutablePath, Path } from "./path";

// Used to import packages
const tsImpl = (_G as Map<unknown, unknown>).get(script) as {
	import: (...modules: LuaSourceContainer[]) => unknown;
};

type CommandRegisteredCallback = (command: BaseCommand) => void;
type GroupRegisteredCallback = (group: CommandGroup) => void;

export interface RegistryEvents {
	/**
	 * Fired when a command is registered.
	 *
	 * @param command The command that was registered
	 */
	commandRegistered: RBXScriptSignal<CommandRegisteredCallback>;

	/**
	 * Fired when a group is registered.
	 *
	 * @param group The group that was registered
	 */
	groupRegistered: RBXScriptSignal<GroupRegisteredCallback>;
}

export abstract class BaseRegistry {
	protected static readonly ROOT_KEY = "__root__";
	protected readonly commands = new Map<string, BaseCommand>();
	protected readonly groups = new Map<string, CommandGroup>();
	protected readonly guards: CommandGuard[] = [];
	protected readonly types = new Map<string, TypeOptions<defined>>();
	protected readonly registeredObjects = new Set<object>();

	protected readonly commandRegistered: BindableEvent<CommandRegisteredCallback> =
		new Instance("BindableEvent");
	protected readonly groupRegistered: BindableEvent<GroupRegisteredCallback> =
		new Instance("BindableEvent");
	protected readonly events: RegistryEvents = {
		commandRegistered: this.commandRegistered.Event,
		groupRegistered: this.groupRegistered.Event,
	};

	protected cachedPaths = new Map<string, Path[]>();

	init(options: SharedOptions) {
		if (options.registerBuiltInTypes) {
			const builtInTypes =
				script.Parent?.Parent?.FindFirstChild("builtin")?.FindFirstChild(
					"types",
				);
			assert(
				builtInTypes !== undefined,
				"Built-in type container does not exist",
			);
			this.register(builtInTypes);
		}
	}

	/**
	 * Loads all {@link ModuleScript}s in the given {@link Instance}.
	 *
	 * If the {@link ModuleScript} returns a function, it will be called with the registry
	 * as an argument.
	 *
	 * If the {@link ModuleScript} contains command(s), these commands will be registered.
	 *
	 * @param container The container containing {@link ModuleScript}s
	 */
	register(container: Instance) {
		let registerCommands = false;
		for (const obj of container.GetChildren()) {
			if (!obj.IsA("ModuleScript")) {
				continue;
			}

			const value = this.import(obj);
			if (typeIs(value, "function")) {
				value(this);
			} else {
				registerCommands = true;
			}
		}

		if (registerCommands) {
			this.registerCommands();
		}
	}

	/**
	 * Registers all commands.
	 *
	 * If the command has already been registered, it will be skipped.
	 */
	registerCommands() {
		for (const [commandClass] of MetadataReflect.metadata) {
			if (this.registeredObjects.has(commandClass)) {
				continue;
			}

			this.registeredObjects.add(commandClass);
			this.registerCommandClass(commandClass);
		}
	}

	/**
	 * Registers a type from a {@link TypeOptions}.
	 *
	 * @param typeOptions The type to register
	 */
	registerType<T extends defined>(typeOptions: TypeOptions<T>) {
		this.types.set(typeOptions.name, typeOptions);
	}

	/**
	 * Registers multiple types from a list of {@link TypeOptions}.
	 *
	 * @param types The types to register
	 */
	registerTypes(...types: TypeOptions<defined>[]) {
		for (const options of types) {
			this.registerType(options);
		}
	}

	/**
	 * Register a list of guards. These will be used on all commands.
	 *
	 * @param guards The guards to register
	 */
	registerGuards(...guards: CommandGuard[]) {
		for (const guard of guards) {
			this.guards.push(guard);
		}
	}

	/**
	 * Registers a list of groups.
	 *
	 * @param groups The groups to register
	 */
	registerGroups(...groups: GroupOptions[]) {
		const commandGroups: CommandGroup[] = [];
		for (const options of groups) {
			const groupPath =
				options.root !== undefined
					? Path.fromString(options.root)
					: Path.empty();
			groupPath.append(options.name);
			commandGroups.push(
				new CommandGroup(ImmutablePath.fromPath(groupPath), options),
			);
		}

		// Sort groups by path size so parent groups are registered first
		commandGroups.sort((a, b) => a.getPath().getSize() < b.getPath().getSize());

		for (const group of commandGroups) {
			const pathString = group.getPath().toString();
			this.validatePath(pathString, false);

			if (group.getPath().getSize() > 1) {
				const parentPath = group.getPath().getParent();
				const parentGroup = this.groups.get(parentPath.toString());
				if (parentGroup === undefined) {
					throw `Parent group '${parentPath}' for group '${pathString}' is not registered`;
				}

				if (parentGroup.hasGroup(group.options.name)) {
					warn(
						`Skipping duplicate child group in ${parentPath}: ${group.options.name}`,
					);
				}

				parentGroup.addGroup(group);
			}

			this.groups.set(pathString, group);
			this.cachePath(group.getPath());
			this.groupRegistered.Fire(group);
		}
	}

	/**
	 * Gets a registered type.
	 *
	 * @param name The name of the type
	 * @returns The registered {@link TypeOptions}, or `undefined` if it is not registered
	 */
	getType(name: string) {
		return this.types.get(name);
	}

	/**
	 * Gets a registered command.
	 *
	 * @param path The path of the command
	 * @returns A {@link BaseCommand} or `undefined` if no command with the given path is registered
	 */
	getCommand(path: Path) {
		return this.commands.get(path.toString());
	}

	/**
	 * Gets a registered command.
	 *
	 * @param path The path of the command as a string
	 * @returns A {@link BaseCommand} or `undefined` if no command with the given path is registered
	 */
	getCommandByString(pathString: string) {
		return this.commands.get(pathString);
	}

	/**
	 * Gets all registered commands.
	 *
	 * @returns An array of all registered commands
	 */
	getCommands() {
		const commands: BaseCommand[] = [];
		for (const [_, command] of this.commands) {
			commands.push(command);
		}
		return commands;
	}

	/**
	 * Gets a registered {@link CommandGroup} from a given {@link Path}.
	 *
	 * @param path The path of the group
	 * @returns A {@link CommandGroup} or `undefined` if no group is registered at the given path
	 */
	getGroup(path: Path) {
		return this.groups.get(path.toString());
	}

	/**
	 * Gets a registered {@link GroupOptions} from a given path string.
	 *
	 * @param pathString The path of the group as a string
	 * @returns A {@link CommandGroup} or `undefined` if no group is registered at the given path
	 */
	getGroupByString(pathString: string) {
		return this.groups.get(pathString);
	}

	/**
	 * Gets all registered groups.
	 *
	 * @returns An array of all registered groups
	 */
	getGroups() {
		const groups: CommandGroup[] = [];
		for (const [_, group] of this.groups) {
			groups.push(group);
		}
		return groups;
	}

	/**
	 * Gets all registered guards.
	 *
	 * @returns An array of all registered guards
	 */
	getGuards() {
		return [...this.guards];
	}

	/**
	 * Gets the root paths of all registered commands and groups.
	 *
	 * @returns An array of all root paths
	 */
	getRootPaths() {
		return this.cachedPaths.get(BaseRegistry.ROOT_KEY) ?? [];
	}

	/**
	 * Gets all paths that are children of the given {@link Path}.
	 *
	 * @param path The path to get the children of
	 * @returns The paths that are children of the given path
	 */
	getChildPaths(path: Path) {
		return this.cachedPaths.get(path.toString()) ?? [];
	}

	/**
	 * Returns registry events, which can be used to listen for
	 * commands and group registration.
	 *
	 * @returns Registry events
	 */
	getEvents() {
		return this.events;
	}

	protected cachePath(path: Path) {
		let key = BaseRegistry.ROOT_KEY;
		for (const i of $range(0, path.getSize() - 1)) {
			const pathSlice = path.slice(0, i);

			const cache = this.cachedPaths.get(key) ?? [];
			this.cachedPaths.set(key, cache);
			key = pathSlice.toString();

			if (cache.some((val) => val.equals(pathSlice))) continue;
			cache.push(pathSlice);
			cache.sort((a, b) => a.getTail() < b.getTail());
		}
	}

	private import(moduleScript: ModuleScript) {
		const [success, value] = pcall(() => tsImpl.import(script, moduleScript));
		if (!success) {
			warn(`Failed to import ${moduleScript.GetFullName()}: ${value}`);
			return;
		}

		return value;
	}

	protected registerCommand(command: BaseCommand, group?: CommandGroup) {
		for (const path of command.getPaths()) {
			this.validatePath(path.toString(), true);
			this.commands.set(path.toString(), command);
			this.cachePath(path);
		}

		if (group !== undefined) {
			group.addCommand(command);
		}

		this.commandRegistered.Fire(command);
	}

	private registerCommandClass(commandClass: object) {
		const classOptions = MetadataReflect.getOwnMetadata<CommanderOptions>(
			commandClass,
			MetadataKey.CommandClass,
		);
		const globalGroups = classOptions?.globalGroups;

		for (const property of MetadataReflect.getOwnProperties(commandClass)) {
			// Get decorator data
			const metadata = MetadataReflect.getOwnMetadata<CommandMetadata>(
				commandClass,
				MetadataKey.Command,
				property,
			);
			assert(
				metadata !== undefined,
				`Command metadata not found: ${commandClass}/${property}`,
			);

			const group = MetadataReflect.getOwnMetadata<string[]>(
				commandClass,
				MetadataKey.Group,
				property,
			);

			const guards = MetadataReflect.getOwnMetadata<CommandGuard[]>(
				commandClass,
				MetadataKey.Guard,
				property,
			);

			const name = metadata.options.name;

			// Get registered command group
			let groupPath =
				globalGroups !== undefined ? new Path([...globalGroups]) : undefined;
			if (group !== undefined && !group.isEmpty()) {
				if (groupPath !== undefined) {
					for (const part of group) {
						groupPath.append(part);
					}
				} else {
					groupPath = new Path(group);
				}
			}

			let commandGroup: CommandGroup | undefined;
			if (groupPath !== undefined) {
				commandGroup = this.getGroup(groupPath);
				if (groupPath.getSize() > 2) {
					throw `Invalid group for command '${name}': a command can only have 2 groups, found ${groupPath.getSize()}`;
				}

				if (commandGroup === undefined) {
					throw `Cannot assign group '${groupPath}' to command '${name}' as it is not registered`;
				}
			}

			const parentPath =
				commandGroup !== undefined
					? commandGroup.getPath()
					: ImmutablePath.empty();
			const path = parentPath.append(metadata.options.name);

			const command = new ExecutableCommand(
				this,
				parentPath.append(name),
				metadata.options,
				(...args) => metadata.func(commandClass, ...args),
				guards ?? [],
			);
			this.registerCommand(command, commandGroup);
		}
	}

	protected validatePath(path: string, isCommand: boolean) {
		const hasCommand = this.commands.has(path);
		if (hasCommand && isCommand) throw `Duplicate command: ${path}`;

		if (hasCommand) {
			throw `A command already exists with the same name as this group: ${path}`;
		}

		const hasGroup = this.groups.has(path);
		if (hasGroup && isCommand)
			throw `A group already exists with the same name as this command: ${path}`;

		if (hasGroup) throw `Duplicate group: ${path}`;
	}
}
