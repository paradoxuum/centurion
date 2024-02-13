import { Result } from "@rbxts/rust-classes";
import {
	CommandGuard,
	CommandOptions,
	GroupOptions,
	TypeOptions,
} from "../types";
import { ObjectUtil, ReadonlyDeepObject } from "../util/data";
import { splitStringBySpace } from "../util/string";
import { CommandInteraction } from "./interaction";
import { ImmutableCommandPath } from "./path";
import { BaseRegistry } from "./registry";

export interface RegistrationData {
	class: defined;
	callback: (...args: unknown[]) => unknown;
	options: CommandOptions;
	guards: CommandGuard[];
}

export abstract class BaseCommand {
	protected readonly argTypes: TypeOptions<defined>[] = [];
	protected readonly path: ImmutableCommandPath;
	readonly options: ReadonlyDeepObject<CommandOptions>;

	constructor(
		registry: BaseRegistry,
		path: ImmutableCommandPath,
		options: CommandOptions,
	) {
		this.path = path;
		this.options = ObjectUtil.freezeDeep(ObjectUtil.copyDeep(options));

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

	abstract execute(interaction: CommandInteraction, text: string): unknown;

	getPath() {
		return this.path;
	}

	getName() {
		return this.options.name;
	}
}

export class ExecutableCommand extends BaseCommand {
	private readonly commandClass: defined;
	private readonly callback: (...args: unknown[]) => unknown;
	private readonly guards: ReadonlyArray<CommandGuard>;

	constructor(
		registry: BaseRegistry,
		path: ImmutableCommandPath,
		commandClass: defined,
		options: CommandOptions,
		callback: (...args: unknown[]) => unknown,
		guards: CommandGuard[],
	) {
		super(registry, path, options);
		this.commandClass = commandClass;
		this.callback = callback;
		this.guards = table.freeze(guards);
	}

	execute(interaction: CommandInteraction, text: string) {
		for (const guard of this.guards) {
			if (!guard(interaction)) return;
		}

		if (interaction.isReplyReceived()) return;

		const transformedArgs = this.transformArgs(text, interaction);
		if (transformedArgs.isErr()) {
			interaction.error(transformedArgs.unwrapErr());
			return;
		}

		return this.callback(
			this.commandClass,
			interaction,
			...transformedArgs.unwrap(),
		);
	}

	transformArgs(
		text: string,
		interaction: CommandInteraction,
	): Result<unknown[], string> {
		const args = splitStringBySpace(text);

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
				return Result.err(`Missing required argument: <b>${argData.name}</b>`);
			}

			const transformedArg = argType.transform(
				args[startIndex + i],
				interaction.executor,
			);
			if (transformedArg.isErr()) return Result.err(transformedArg.unwrapErr());
			transformedArgs[i] = transformedArg.unwrap();
		}

		return Result.ok(transformedArgs);
	}

	toString() {
		return `ExecutableCommand{path=${this.path}}`;
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
