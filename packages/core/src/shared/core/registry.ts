import { Signal } from "@rbxts/beacon";
import { t } from "@rbxts/t";
import { SharedOptions } from "../options";
import {
	ArgumentType,
	CommandCallback,
	CommandGuard,
	CommandMetadata,
	CommandOptions,
	GroupOptions,
} from "../types";
import { importModule } from "../util/import";
import { MetadataReflect } from "../util/reflect";
import { BaseCommand, CommandGroup, ExecutableCommand } from "./command";
import { CommandContext } from "./context";
import { MetadataKey } from "./decorators";
import { ImmutableRegistryPath, RegistryPath } from "./path";

const argTypeSchema = t.interface({
	name: t.string,
	expensive: t.boolean,
	validate: t.callback,
	transform: t.callback,
	suggestions: t.optional(t.callback),
});

function isArgumentType(value: unknown): value is ArgumentType<unknown> {
	return argTypeSchema(value);
}

export abstract class BaseRegistry {
	protected static readonly ROOT_KEY = "__root__";
	protected readonly commands = new Map<string, BaseCommand>();
	protected readonly groups = new Map<string, CommandGroup>();
	protected readonly types = new Map<string, ArgumentType<unknown>>();
	protected readonly registeredObjects = new Set<object>();

	readonly commandRegistered = new Signal<[command: BaseCommand]>();
	readonly groupRegistered = new Signal<[group: CommandGroup]>();

	protected cachedPaths = new Map<string, RegistryPath[]>();
	protected globalGuards = new Array<CommandGuard>();

	init(options: SharedOptions) {
		this.globalGuards = options.guards ?? [];
		if (options.registerBuiltInTypes) {
			const builtInTypes =
				script.Parent?.Parent?.FindFirstChild("builtin")?.FindFirstChild(
					"types",
				);
			assert(
				builtInTypes !== undefined,
				"Built-in type container does not exist",
			);
			this.load(builtInTypes);
		}
	}

	/**
	 * Loads all {@link ModuleScript} instances in the given instance.
	 *
	 * By default, only direct children of the container are loaded. If the `descendants`
	 * parameter is true, all descendants of the container will be loaded.
	 *
	 * If the {@link ModuleScript} returns a function, it will be called with the registry
	 * as an argument.
	 *
	 * @param container The container to iterate over
	 * @param descendants Whether to load descendants of the container.
	 */
	load(container: Instance, descendants = false) {
		const instances = descendants
			? container.GetDescendants()
			: container.GetChildren();

		for (const obj of instances) {
			if (!obj.IsA("ModuleScript")) continue;

			const value = importModule(obj);
			if (typeIs(value, "function")) value(this);
		}
	}

	/**
	 * Registers any loaded commands and types that need to be registered.
	 *
	 * If the command/type has already been registered, it will be skipped.
	 */
	register() {
		for (const [obj] of MetadataReflect.metadata) {
			if (this.registeredObjects.has(obj)) continue;
			this.registeredObjects.add(obj);
			if (
				MetadataReflect.getOwnMetadata<boolean>(obj, MetadataKey.CommandClass)
			) {
				this.registerCommandClass(obj);
				continue;
			}

			if (
				MetadataReflect.getOwnMetadata<boolean>(obj, MetadataKey.Type) &&
				isArgumentType(obj)
			) {
				this.registerType(obj);
			}
		}
	}

	/**
	 * Registers a command with the given options and callback.
	 *
	 * Groups and guards can optionally be provided.
	 *
	 * @param options The command's options.
	 * @param callback The command callback.
	 * @param group The group to register the command under.
	 * @param guards The guards to apply to the command.
	 */
	registerCommand(
		options: CommandOptions,
		// biome-ignore lint/suspicious/noExplicitAny: Type checking is not possible for command callbacks and unknown is too restrictive in this case.
		callback: (ctx: CommandContext, ...args: any[]) => void,
		group?: string[],
		guards?: CommandGuard[],
	) {
		this.addCommand(
			this.createCommand(
				options,
				callback,
				group !== undefined ? new ImmutableRegistryPath(group) : undefined,
				guards,
			),
		);
	}

	/**
	 * Registers one or more argument types.
	 *
	 * @param types The types to register
	 */
	registerType(...types: ArgumentType<unknown>[]) {
		for (const options of types) {
			this.types.set(options.name, options);
		}
	}

	/**
	 * Registers one or more groups.
	 *
	 * @param groups The groups to register
	 */
	registerGroup(...groups: GroupOptions[]) {
		const commandGroups: CommandGroup[] = [];
		for (const options of groups) {
			commandGroups.push(
				new CommandGroup(
					new ImmutableRegistryPath([...(options.parent ?? []), options.name]),
					options,
				),
			);
		}

		// Sort groups by path size so parent groups are registered first
		commandGroups.sort((a, b) => a.getPath().size() < b.getPath().size());

		for (const group of commandGroups) {
			const pathString = group.getPath().toString();
			this.validatePath(pathString, false);

			if (group.getPath().size() > 1) {
				const parentPath = group.getPath().parent();
				const parentGroup = this.groups.get(parentPath.toString());
				if (parentGroup === undefined) {
					throw `Parent group '${parentPath}' for group '${pathString}' is not registered`;
				}

				if (parentGroup.hasGroup(group.options.name)) {
					warn(
						`Skipping duplicate child group in ${parentPath}: ${group.options.name}`,
					);
					continue;
				}

				parentGroup.addGroup(group);
			}

			this.groups.set(pathString, group);
			this.cachePath(group.getPath());
			this.groupRegistered.Fire(group);
		}
	}

	/**
	 * Returns a registered argument type with the given name.
	 *
	 * @param name The name of the type.
	 * @returns An {@link ArgumentType}, or `undefined` if no type with the given name is registered.
	 */
	getType(name: string) {
		return this.types.get(name);
	}

	/**
	 * Returns a registered command with the given path.
	 *
	 * @param path The command's path.
	 * @returns A {@link BaseCommand}, or `undefined` if no command with the given path is registered.
	 */
	getCommand(path: RegistryPath) {
		return this.commands.get(path.toString());
	}

	/**
	 * Returns a registered command with the given path as a string.
	 *
	 * @param path The command's path as a string.
	 * @returns A {@link BaseCommand}, or `undefined` if no command with the given path is registered.
	 */
	getCommandByString(path: string) {
		return this.commands.get(path);
	}

	/**
	 * Returns all registered commands.
	 *
	 * @returns An array of {@link BaseCommand} instances.
	 */
	getCommands() {
		const commands: BaseCommand[] = [];
		for (const [_, command] of this.commands) {
			commands.push(command);
		}
		return commands;
	}

	/**
	 * Returns a registered group with the given path.
	 *
	 * @param path The group's path.
	 * @returns A {@link CommandGroup}, or `undefined` if no group with the given path is registered.
	 */
	getGroup(path: RegistryPath) {
		return this.groups.get(path.toString());
	}

	/**
	 * Returns a registered group with the given path as a string.
	 *
	 * @param path The group's path as a string.
	 * @returns A {@link CommandGroup}, or `undefined` if no group with the given path is registered.
	 */
	getGroupByString(path: string) {
		return this.groups.get(path);
	}

	/**
	 * Returns all registered groups.
	 *
	 * @returns An array of {@link CommandGroup} instances.
	 */
	getGroups() {
		const groups: CommandGroup[] = [];
		for (const [_, group] of this.groups) {
			groups.push(group);
		}
		return groups;
	}

	/**
	 * Returns all registered types.
	 *
	 * @returns An array of {@link ArgumentType} objects.
	 */
	getTypes() {
		const types: ArgumentType<unknown>[] = [];
		for (const [_, typeObject] of this.types) {
			types.push(typeObject);
		}
		return types;
	}

	/**
	 * Returns all registered root paths - paths made up of a single part.
	 *
	 * @returns An array of {@linkeRegistryPath} instances.
	 */
	getRootPaths() {
		return this.cachedPaths.get(BaseRegistry.ROOT_KEY) ?? [];
	}

	/**
	 * Returns all paths that are children of the given path.
	 *
	 * @param path The path to get the children of.
	 * @returns An array of {@link RegistryPath} instances.
	 */
	getChildPaths(path: RegistryPath) {
		return this.cachedPaths.get(path.toString()) ?? [];
	}

	protected cachePath(path: RegistryPath) {
		let key = BaseRegistry.ROOT_KEY;
		for (const i of $range(0, path.size() - 1)) {
			const pathSlice = path.slice(0, i);

			const cache = this.cachedPaths.get(key) ?? [];
			this.cachedPaths.set(key, cache);
			key = pathSlice.toString();

			if (cache.some((val) => val.equals(pathSlice))) continue;
			cache.push(pathSlice);
			cache.sort((a, b) => a.tail() < b.tail());
		}
	}

	protected addCommand(command: BaseCommand, group?: CommandGroup) {
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

	private createCommand(
		options: CommandOptions,
		callback: CommandCallback,
		group?: ImmutableRegistryPath,
		guards: CommandGuard[] = [],
	) {
		const commandPath =
			group !== undefined
				? group.append(options.name)
				: new ImmutableRegistryPath([options.name]);

		let commandGroup: CommandGroup | undefined;
		if (group !== undefined) {
			commandGroup = this.getGroup(group);
			if (commandGroup === undefined) {
				throw `Cannot assign group '${group}' to command '${commandPath}' as it is not registered`;
			}
		}

		return new ExecutableCommand(
			this,
			commandPath,
			options,
			callback,
			guards !== undefined ? [...guards] : [],
		);
	}

	private registerCommandClass(commandClass: object) {
		const classGroups = MetadataReflect.getOwnMetadata<string[]>(
			commandClass,
			MetadataKey.Group,
		);

		const classGuards =
			MetadataReflect.getOwnMetadata<CommandGuard[]>(
				commandClass,
				MetadataKey.Guard,
			) ?? [];

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

			const guards =
				MetadataReflect.getOwnMetadata<CommandGuard[]>(
					commandClass,
					MetadataKey.Guard,
					property,
				) ?? [];

			// Get registered command group
			const groupParts = classGroups !== undefined ? [...classGroups] : [];
			if (group !== undefined && !group.isEmpty()) {
				for (const part of group) {
					groupParts.push(part);
				}
			}

			this.addCommand(
				this.createCommand(
					metadata.options,
					(ctx, ...args) => metadata.func(commandClass, ctx, ...args),
					!groupParts.isEmpty()
						? new ImmutableRegistryPath(groupParts)
						: undefined,
					[...this.globalGuards, ...classGuards, ...guards],
				),
			);
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
