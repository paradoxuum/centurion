import { SharedOptions } from "../options";
import {
	CommandGuard,
	CommandMetadata,
	CommanderOptions,
	GroupOptions,
	TypeOptions,
} from "../types";
import { MetadataReflect } from "../util/reflect";
import {
	BaseCommand,
	CommandGroup,
	ExecutableCommand,
	RegistrationData,
} from "./command";
import { MetadataKey } from "./decorators";
import { ImmutablePath, Path } from "./path";

// Used to import packages
const tsImpl = (_G as Map<unknown, unknown>).get(script) as {
	import: (...modules: LuaSourceContainer[]) => unknown;
};

export abstract class BaseRegistry {
	protected static readonly ROOT_KEY = "__root__";
	protected readonly commands = new Map<string, BaseCommand>();
	protected readonly groups = new Map<string, CommandGroup>();
	protected readonly guards: CommandGuard[] = [];
	protected readonly types = new Map<string, TypeOptions<defined>>();
	protected readonly registeredObjects = new Set<object>();
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
	 * Gets all registered commands.
	 *
	 * @returns An array of all registered commands
	 */
	getCommands() {
		const commands: BaseCommand[] = [];
		for (const [_, v] of this.commands) {
			commands.push(v);
		}
		return commands;
	}

	/**
	 * Gets a registered {@link GroupOptions} from a given {@link Path}.
	 *
	 * @param path The path of the group
	 * @returns A {@link GroupOptions} or `undefined` if none exists at the given path
	 */
	getGroup(path: Path) {
		assert(
			path.getSize() < 3,
			`Invalid group path '${path}', a group path has a maximum of 2 parts`,
		);

		const root = this.groups.get(path.getPart(0));
		if (path.getSize() === 1 || root === undefined) {
			return root;
		}

		return root.getGroup(path.getPart(1));
	}

	/**
	 * Gets all registered groups.
	 *
	 * @returns An array of all registered groups
	 */
	getGroups() {
		const groups: CommandGroup[] = [];
		for (const path of this.getPaths()) {
			const group = this.getGroup(path);
			if (group !== undefined) {
				groups.push(group);
			}
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
	 * Gets the paths of all registered commands and groups.
	 *
	 * @returns An array of all paths
	 */
	getPaths() {
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

	protected cachePath(path: Path) {
		let cacheKey = BaseRegistry.ROOT_KEY;
		if (path.getSize() === 3) {
			if (!this.cachedPaths.has(path.getRoot())) {
				this.addCacheEntry(
					BaseRegistry.ROOT_KEY,
					Path.fromString(path.getRoot()),
				);
			}

			const childPath = path.slice(0, 1);
			this.addCacheEntry(path.getRoot(), childPath);
			cacheKey = childPath.toString();
		}

		this.addCacheEntry(cacheKey, path);
	}

	private addCacheEntry(key: string, path: Path) {
		const cache = this.cachedPaths.get(key) ?? [];
		cache.push(path);
		cache.sort((a, b) => a.getTail() < b.getTail());
		this.cachedPaths.set(key, cache);
		return cache;
	}

	private import(moduleScript: ModuleScript) {
		const [success, value] = pcall(() => tsImpl.import(script, moduleScript));
		if (!success) {
			warn(`Failed to import ${moduleScript.GetFullName()}: ${value}`);
			return;
		}

		return value;
	}

	protected registerCommand(data: RegistrationData, group?: CommandGroup) {
		const options = data.options;

		const parentPath =
			group !== undefined ? group.getPath() : new ImmutablePath([]);
		const path = parentPath.append(options.name);

		const command = new ExecutableCommand(
			this,
			ImmutablePath.fromPath(path),
			data.class,
			data.options,
			data.callback,
			[...data.guards],
		);

		const aliases = options.aliases ?? [];
		const paths = [path, ...aliases.map((a) => parentPath.append(a))];
		for (const path of paths) {
			this.validatePath(path.toString(), true);
			this.cachePath(path);
			this.updateCommandMap(path.toString(), command);
		}

		if (group !== undefined) {
			group.addCommand(command);
		}

		return command;
	}

	private registerCommandClass(commandClass: object) {
		const classOptions = MetadataReflect.getOwnMetadata<CommanderOptions>(
			commandClass,
			MetadataKey.CommandClass,
		);
		const globalGroups = classOptions?.globalGroups ?? [];

		// Register command groups
		if (classOptions?.groups !== undefined) {
			this.registerGroups(classOptions.groups);
		}

		for (const name of MetadataReflect.getOwnProperties(commandClass)) {
			// Get decorator data
			const metadata = MetadataReflect.getOwnMetadata<CommandMetadata>(
				commandClass,
				MetadataKey.Command,
				name,
			);
			assert(
				metadata !== undefined,
				`Command metadata not found: ${commandClass}/${name}`,
			);

			const group = MetadataReflect.getOwnMetadata<string[]>(
				commandClass,
				MetadataKey.Group,
				name,
			);

			const guards = MetadataReflect.getOwnMetadata<CommandGuard[]>(
				commandClass,
				MetadataKey.Guard,
				name,
			);

			// Get registered command group
			let commandGroup: CommandGroup | undefined;
			if (group !== undefined && !group.isEmpty()) {
				const groupPath = new Path([...globalGroups, ...group]);

				if (groupPath.getSize() > 2) {
					throw `Invalid group for command '${name}': a command can only have 2 groups, found ${groupPath.getSize()}`;
				}

				commandGroup = this.getGroup(groupPath);
				assert(
					commandGroup !== undefined,
					`The group '${groupPath}' assigned to command '${name}' is invalid`,
				);
			}

			this.registerCommand(
				{
					class: commandClass,
					callback: metadata.func,
					options: metadata.options,
					guards: guards ?? [],
				},
				commandGroup,
			);
		}
	}

	protected registerGroups(groups: GroupOptions[]) {
		const childMap = new Map<string, GroupOptions[]>();
		for (const group of groups) {
			if (group.root !== undefined) {
				const childArray = childMap.get(group.root) ?? [];
				childArray.push(group);
				childMap.set(group.root, childArray);
				continue;
			}

			if (this.groups.has(group.name)) {
				warn("Skipping duplicate group:", group.name);
				continue;
			}

			this.validatePath(group.name, false);
			this.updateGroupMap(group.name, this.createGroup(group));
		}

		for (const [root, children] of childMap) {
			const rootGroup = this.groups.get(root);
			assert(rootGroup !== undefined, `Parent group '${root}' does not exist'`);

			for (const child of children) {
				if (rootGroup.hasGroup(child.name)) {
					warn(`Skipping duplicate child group in ${root}: ${child}`);
					continue;
				}

				const childGroup = this.createGroup(child);
				rootGroup.addGroup(childGroup);
				this.updateGroupMap(childGroup.path.toString(), childGroup);
			}
		}
	}

	protected createGroup(group: GroupOptions) {
		const groupParts: string[] = [];
		if (group.root !== undefined) {
			groupParts.push(group.root);
		}

		groupParts.push(group.name);
		return new CommandGroup(new ImmutablePath(groupParts), group);
	}

	protected validatePath(path: string, isCommand: boolean) {
		const hasCommand = this.commands.has(path);
		if (hasCommand && isCommand) throw `Duplicate command: ${path}`;

		if (hasCommand)
			throw `A command already exists with the same name as this group: ${path}`;

		const hasGroup = this.groups.has(path);
		if (hasGroup && isCommand)
			throw `A group already exists with the same name as this command: ${path}`;

		if (hasGroup) throw `Duplicate group: ${path}`;
	}

	protected updateCommandMap(key: string, command: BaseCommand) {
		this.commands.set(key, command);
	}

	protected updateGroupMap(key: string, group: CommandGroup) {
		this.groups.set(key, group);
	}
}
