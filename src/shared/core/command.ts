import { Result } from "@rbxts/rust-classes";
import { freeze as freezeArray } from "@rbxts/sift/out/Array";
import { copyDeep as copyObjectDeep, freezeDeep as freezeObjectDeep } from "@rbxts/sift/out/Dictionary";
import { ReadonlyDeepObject } from "@rbxts/sift/out/Util";
import { CommandMetadata, CommandOptions, GroupOptions, GuardFunction, TypeOptions } from "../types";
import { Reflect } from "../util/reflect";
import { MetadataKey } from "./decorators";
import { CommandInteraction } from "./interaction";
import { ImmutableCommandPath } from "./path";
import { BaseRegistry } from "./registry";

export class CommandData {
	private constructor(
		readonly metadata: Readonly<CommandMetadata>,
		readonly group: ReadonlyArray<string>,
		readonly guards: ReadonlyArray<GuardFunction>,
	) {}

	static fromHolder(commandHolder: object, commandName: string) {
		const metadata = Reflect.getOwnMetadata<CommandMetadata>(commandHolder, MetadataKey.Command, commandName);
		assert(metadata !== undefined, `Command metadata not found: ${commandHolder}/${commandName}`);

		const group = Reflect.getOwnMetadata<string[]>(commandHolder, MetadataKey.Group, commandName);
		const guards = Reflect.getOwnMetadata<GuardFunction[]>(commandHolder, MetadataKey.Guard, commandName);

		return new CommandData(metadata, group ?? [], guards ?? []);
	}
}

export abstract class BaseCommand {
	protected readonly argTypes: TypeOptions<defined>[] = [];
	protected readonly path: ImmutableCommandPath;
	readonly options: ReadonlyDeepObject<CommandOptions>;

	constructor(registry: BaseRegistry, path: ImmutableCommandPath, options: CommandOptions) {
		this.path = path;
		this.options = freezeObjectDeep(copyObjectDeep(options));

		if (options.arguments === undefined) {
			return;
		}

		// Assert that the required arguments precede optional arguments
		let hadOptional = false;
		for (const i of $range(0, options.arguments.size() - 1)) {
			const arg = options.arguments[i];
			if (arg.optional === true) {
				hadOptional = true;
			} else if (hadOptional) {
				throw `Command '${options.name}' has a required argument after an
					optional argument (arg ${arg.name} at position ${i + 1})`;
			}

			const argType = registry.getType(arg.type);
			if (argType === undefined) {
				throw `[Command/${options.name}] Argument '${arg.name}' uses a type that is unregistered: ${arg.type}`;
			}

			this.argTypes.push(argType);
		}
	}

	abstract execute(interaction: CommandInteraction, args: string[]): unknown;

	getPath() {
		return this.path;
	}

	getName() {
		return this.options.name;
	}
}

export class ExecutableCommand extends BaseCommand {
	private readonly func: (...args: unknown[]) => unknown;
	private readonly guards: ReadonlyArray<GuardFunction>;

	constructor(
		registry: BaseRegistry,
		path: ImmutableCommandPath,
		options: CommandOptions,
		func: (...args: unknown[]) => unknown,
		guards: GuardFunction[],
	) {
		super(registry, path, options);
		this.func = func;
		this.guards = freezeArray(guards);
	}

	static create(registry: BaseRegistry, path: ImmutableCommandPath, data: CommandMetadata, guards?: GuardFunction[]) {
		return new ExecutableCommand(registry, path, data.options, data.func, guards ?? []);
	}

	execute(interaction: CommandInteraction, args: string[]) {
		const runCommand = this.getCommandCallback(args);
		return runCommand(interaction);
	}

	transformArgs(args: string[]): Result<unknown[], string> {
		const argOptions = this.options.arguments;
		if (argOptions === undefined || argOptions.isEmpty()) {
			return Result.ok([]);
		}

		const startIndex = this.path.getSize();
		const endIndex = args.size() - startIndex - 1;

		const transformedArgs: unknown[] = [];
		for (const i of $range(0, this.argTypes.size() - 1)) {
			const argType = this.argTypes[i];
			if (argType === undefined) continue;

			const argData = argOptions[i];
			if (i > endIndex) {
				if (argData.optional) break;
				return Result.err(`Missing required argument: ${argData.name}`);
			}

			const transformedArg = argType.transform(args[startIndex + i]);
			if (transformedArg.isErr()) return Result.err(transformedArg.unwrapErr());
			transformedArgs[i] = transformedArg.unwrap();
		}

		return Result.ok(transformedArgs);
	}

	transformArg(index: number, text: string): Result<defined, string> {
		if (index < 0 && index >= this.argTypes.size()) {
			throw "Argument index out of bounds";
		}

		const argType = this.argTypes[index];

		try {
			return Result.ok(argType.transform(text));
		} catch (err) {
			return Result.err(tostring(err));
		}
	}

	toString() {
		return `ExecutableCommand{path=${this.path}}`;
	}

	protected getCommandCallback(args: string[]) {
		const guardCount = this.guards.size();
		let nextIndex = 0;

		const runNext = (interaction: CommandInteraction) => {
			// Once we reach the last index, run the command
			if (nextIndex === guardCount) {
				const transformedArgs = this.transformArgs(args);
				if (transformedArgs.isErr()) {
					interaction.error(transformedArgs.unwrapErr());
					return;
				}

				return this.func(undefined, interaction, ...transformedArgs.unwrap());
			}

			const guardResult = this.guards[nextIndex++](runNext, interaction);
			if (guardResult === false || interaction.isReplyReceived()) return;
		};

		return runNext;
	}
}

export class CommandGroup {
	private readonly commands = new Map<string, ExecutableCommand>();
	private readonly groups = new Map<string, CommandGroup>();
	readonly options: ReadonlyDeepObject<GroupOptions>;

	constructor(
		readonly path: ImmutableCommandPath,
		options: GroupOptions,
	) {
		this.options = options;
	}

	addCommand(command: ExecutableCommand) {
		if (!command.getPath().isChildOf(this.path)) {
			throw `${command} is not a child of this group (${this})`;
		}

		const commandName = command.getName();
		if (this.hasCommand(commandName)) {
			throw `There is already a command with the name '${commandName} in ${this}`;
		}

		if (this.hasGroup(commandName)) {
			throw `There is already a group with the same name as the command '${command}' in ${this}`;
		}

		this.commands.set(commandName, command);
	}

	addGroup(group: CommandGroup) {
		if (group === this) {
			throw `Cannot add group to itself (${this})`;
		}

		if (!group.getPath().isChildOf(this.path)) {
			throw `${group} is not a child of this group (${this})`;
		}

		const groupName = group.options.name;
		if (this.hasGroup(groupName)) {
			throw `There is already a group with the name '${groupName} in ${this}`;
		}

		if (this.hasCommand(groupName)) {
			throw `There is already a command with the same name as the group '${groupName}' in ${this}`;
		}

		this.groups.set(groupName, group);
	}

	getCommand(name: string) {
		return this.commands.get(name);
	}

	getGroup(name: string) {
		return this.groups.get(name);
	}

	hasCommand(name: string) {
		return this.commands.has(name);
	}

	hasGroup(name: string) {
		return this.groups.has(name);
	}

	getCommands() {
		const commandsArray: ExecutableCommand[] = [];
		for (const [_, command] of this.commands) {
			commandsArray.push(command);
		}
		return commandsArray;
	}

	getGroups() {
		const groupsArray: CommandGroup[] = [];
		for (const [_, group] of this.groups) {
			groupsArray.push(group);
		}
		return groupsArray;
	}

	getPath() {
		return this.path;
	}

	toString() {
		return `CommandGroup{path=${this.path}}`;
	}
}
