import { Signal } from "@rbxts/beacon";
import { t } from "@rbxts/t";
import {
	ArgumentType,
	CommandCallback,
	CommandGuard,
	CommandOptions,
	GroupOptions,
	RegisterOptions,
	SharedConfig,
} from "../types";
import { ReadonlyDeep } from "../util/data";
import { CenturionLogger } from "../util/log";
import {
	BaseCommand,
	CommandGroup,
	CommandMetadata,
	ExecutableCommand,
} from "./command";
import { CommandContext } from "./context";
import { DecoratorMetadata, MetadataKey } from "./metadata";
import { ImmutableRegistryPath, RegistryPath } from "./path";

type Constructor<T = object> = new (...args: never[]) => T;

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

export abstract class BaseRegistry<
	C extends ReadonlyDeep<SharedConfig> = ReadonlyDeep<SharedConfig>,
> {
	private static readonly ROOT_KEY = "__root__";
	private readonly loadModule: (module: ModuleScript) => unknown;

	protected readonly commands = new Map<string, BaseCommand>();
	protected readonly groups = new Map<string, CommandGroup>();
	protected readonly types = new Map<string, ArgumentType<unknown>>();
	protected readonly registeredObjects = new Set<object>();
	protected readonly logger: CenturionLogger;
	protected cachedPaths = new Map<string, RegistryPath[]>();
	protected globalGuards = new Array<CommandGuard>();

	readonly commandRegistered = new Signal<[command: BaseCommand]>();
	readonly groupRegistered = new Signal<[group: CommandGroup]>();

	constructor(protected readonly config: C) {
		this.logger = new CenturionLogger(config.logLevel, "Registry");
		this.globalGuards = [...config.guards] ?? [];

		const tsImpl = (_G as Map<unknown, unknown>).get(script);
		this.loadModule = t.interface({
			import: t.callback,
		})(tsImpl)
			? (module) => tsImpl.import(script, module)
			: require;
	}

	init() {
		if (this.config.registerBuiltInTypes) {
			const builtInTypes =
				script.Parent?.Parent?.FindFirstChild("builtin")?.FindFirstChild(
					"types",
				);
			this.logger.assert(
				builtInTypes !== undefined,
				"Failed to locate built-in types",
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

			const [success, value] = pcall(() => this.loadModule(obj));
			if (!success) {
				this.logger.warn(
					`Failed to load module ${obj.GetFullName()}: ${value}`,
				);
				continue;
			}

			if (typeIs(value, "function")) {
				this.logger.debug(
					`Loaded module ${obj.GetFullName()}, calling returned function...`,
				);
				value(this);
			} else {
				this.logger.debug(`Loaded module ${obj.GetFullName()}`);
			}
		}
	}

	/**
	 * Registers any loaded commands and types that need to be registered.
	 *
	 * If the command/type has already been registered, it will be skipped.
	 */
	register() {
		const constructors: Constructor<object>[] = [];
		for (const [obj] of DecoratorMetadata.metadata) {
			if (this.registeredObjects.has(obj)) continue;

			if (DecoratorMetadata.hasOwnMetadata(obj, MetadataKey.Register)) {
				constructors.push(obj as Constructor<object>);
				continue;
			}

			if (
				DecoratorMetadata.hasOwnMetadata(obj, MetadataKey.Type) &&
				isArgumentType(obj)
			) {
				this.registerType(obj);
				this.registeredObjects.add(obj);
			}
		}

		for (const ctor of constructors) {
			this.registerCommandClass(ctor);
			this.registeredObjects.add(ctor);
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
			this.logger.debug(`Registered type: ${options.name}`);
		}
	}

	/**
	 * Registers one or more groups.
	 *
	 * @param groups The groups to register
	 */
	registerGroup(...groups: GroupOptions[]) {
		const commandGroups = groups.map(
			(options) =>
				new CommandGroup(
					this.config,
					new ImmutableRegistryPath([...(options.parent ?? []), options.name]),
					options,
				),
		);

		// Sort groups by path size so parent groups are registered first
		commandGroups.sort((a, b) => a.getPath().size() < b.getPath().size());

		for (const group of commandGroups) {
			const pathString = group.getPath().toString();
			this.validatePath(pathString, false);

			if (group.getPath().size() > 1) {
				const parentPath = group.getPath().parent();
				const parentGroup = this.groups.get(parentPath.toString());
				if (parentGroup === undefined) {
					this.logger.error(
						`Parent group '${parentPath}' for group '${pathString}' is not registered`,
					);
					return;
				}

				if (parentGroup.hasGroup(group.options.name)) {
					this.logger.warn(
						`Skipping duplicate child group in ${parentPath}: ${group.options.name}`,
					);
					continue;
				}

				parentGroup.addGroup(group);
			}

			this.groups.set(pathString, group);
			this.cachePath(group.getPath());
			this.groupRegistered.Fire(group);
			this.logger.debug(`Registered group: ${pathString}`);
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
		this.logger.debug(`Registered command: ${command.getPath()}`);
	}

	private createCommand(
		options: CommandOptions,
		callback: CommandCallback,
		group?: ImmutableRegistryPath,
		guards: CommandGuard[] = [],
		metadata?: CommandMetadata,
	) {
		const commandPath =
			group !== undefined
				? group.append(options.name)
				: new ImmutableRegistryPath([options.name]);

		let commandGroup: CommandGroup | undefined;
		if (group !== undefined) {
			commandGroup = this.getGroup(group);
			this.logger.assert(
				commandGroup !== undefined,
				`Cannot assign group '${group}' to command '${commandPath}' as it is not registered`,
			);
		}

		return new ExecutableCommand(
			this.config,
			this,
			commandPath,
			options,
			callback,
			guards !== undefined ? [...guards] : [],
			metadata,
		);
	}

	private registerCommandClass<T extends object>(commandClass: Constructor<T>) {
		const registerOptions = DecoratorMetadata.getOwnMetadata<RegisterOptions>(
			commandClass,
			MetadataKey.Register,
		);
		this.logger.assert(
			registerOptions !== undefined,
			`Metadata not found for @Register: ${commandClass}`,
		);

		if (registerOptions.groups !== undefined) {
			this.registerGroup(...registerOptions.groups);
		}

		const classGroups =
			DecoratorMetadata.getOwnMetadata<string[]>(
				commandClass,
				MetadataKey.Group,
			) ?? [];

		const classGuards =
			DecoratorMetadata.getOwnMetadata<CommandGuard[]>(
				commandClass,
				MetadataKey.Guard,
			) ?? [];

		const [obj, construct] = this.getConstructor(commandClass);
		construct();

		for (const property of DecoratorMetadata.getOwnProperties(commandClass)) {
			// Get decorator data
			const options = DecoratorMetadata.getOwnMetadata<CommandOptions>(
				commandClass,
				MetadataKey.Command,
				property,
			);
			this.logger.assert(
				options !== undefined,
				`Metadata not found for @Command: ${commandClass}/${property}`,
			);

			const group = DecoratorMetadata.getOwnMetadata<string[]>(
				commandClass,
				MetadataKey.Group,
				property,
			);

			const guards =
				DecoratorMetadata.getOwnMetadata<CommandGuard[]>(
					commandClass,
					MetadataKey.Guard,
					property,
				) ?? [];

			const groupParts = [...classGroups];
			if (group !== undefined && !group.isEmpty()) {
				for (const part of group) {
					groupParts.push(part);
				}
			}

			const callback = (commandClass as never as Record<string, unknown>)[
				property
			] as Callback;
			this.addCommand(
				this.createCommand(
					options,
					(ctx, ...args) => callback(commandClass, ctx, ...args),
					!groupParts.isEmpty()
						? new ImmutableRegistryPath(groupParts)
						: undefined,
					[...this.globalGuards, ...classGuards, ...guards],
					{
						ctor: commandClass,
						instance: obj,
						property,
					},
				),
			);
		}
	}

	protected validatePath(path: string, isCommand: boolean) {
		const commandRegistered = this.commands.has(path);
		if (commandRegistered && isCommand) {
			this.logger.error(`Duplicate command: ${path}`);
			return;
		}

		if (commandRegistered) {
			this.logger.error(
				`A command already exists with the same name as this group: ${path}`,
			);
			return;
		}

		const groupRegistered = this.groups.has(path);
		if (groupRegistered && isCommand) {
			this.logger.error(
				`A group already exists with the same name as this command: ${path}`,
			);
			return;
		}

		if (groupRegistered) {
			this.logger.error(`Duplicate group: ${path}`);
		}
	}

	private getConstructor<T extends Constructor<unknown>>(ctor: T) {
		const obj = setmetatable({}, ctor as never) as InstanceType<T>;

		return [
			obj,
			(...args: ConstructorParameters<T>) => {
				const result = (
					obj as { constructor(...args: unknown[]): unknown }
				).constructor(...args);
				assert(
					result === undefined || result === obj,
					"Command class constructors are not allowed to return values.",
				);
			},
		] as const;
	}
}
