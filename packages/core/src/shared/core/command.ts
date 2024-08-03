import {
	ArgumentOptions,
	ArgumentType,
	CommandCallback,
	CommandGuard,
	CommandOptions,
	GroupOptions,
	SharedConfig,
} from "../types";
import {
	ArrayUtil,
	ObjectUtil,
	ReadonlyDeep,
	ReadonlyDeepObject,
} from "../util/data";
import { CenturionLogger } from "../util/log";
import { splitString } from "../util/string";
import { TransformResult } from "../util/type";
import { CommandContext } from "./context";
import { ImmutableRegistryPath } from "./path";
import { BaseRegistry } from "./registry";

interface ArgumentData {
	options: ArgumentOptions;
	type: ArgumentType<unknown>;
}

export abstract class BaseCommand {
	protected readonly arguments: ArgumentData[] = [];
	protected readonly path: ImmutableRegistryPath;
	protected readonly logger: CenturionLogger;
	readonly options: ReadonlyDeepObject<CommandOptions>;

	constructor(
		config: ReadonlyDeep<SharedConfig>,
		registry: BaseRegistry,
		path: ImmutableRegistryPath,
		options: CommandOptions,
	) {
		this.path = path;
		this.options = ObjectUtil.freezeDeep(ObjectUtil.copyDeep(options));
		this.logger = new CenturionLogger(config.logLevel, `Command/${path}`);

		if (options.arguments === undefined) return;

		let hadOptional = false;
		const lastIndex = options.arguments.size() - 1;
		for (const i of $range(0, options.arguments.size() - 1)) {
			const arg: ArgumentOptions | undefined = options.arguments[i];
			if (arg.optional === true) {
				hadOptional = true;
			} else if (hadOptional) {
				this.logger.error(
					`Command '${options.name}' has a required argument after an optional argument (arg ${arg.name} at position ${i + 1})`,
				);
			}

			if (typeIs(arg.numArgs, "number") && arg.numArgs < 1) {
				this.logger.error(
					`Command '${options.name}' has an argument that requires less than 1 argument (arg ${arg.name} at position ${i + 1})`,
				);
			} else if (arg.numArgs === "rest" && i !== lastIndex) {
				this.logger.error(
					`Command '${options.name}' has a rest argument that is not the last argument (arg ${arg.name} at position ${i + 1})`,
				);
			}

			const argType = registry.getType(arg.type);
			this.logger.assert(
				argType !== undefined,
				`Argument '${arg.name}' uses a type that is unregistered: ${arg.type}`,
			);
			this.arguments.push({
				options: arg,
				type: argType,
			});
		}
	}

	abstract execute(context: CommandContext, args: string[]): unknown;

	getPath() {
		return this.path;
	}

	getPaths() {
		const paths = [this.path];
		if (this.options.aliases !== undefined) {
			const parentPath = this.path.parent();
			for (const alias of this.options.aliases) {
				paths.push(parentPath.append(alias));
			}
		}
		return paths;
	}

	getName() {
		return this.options.name;
	}
}

export class ExecutableCommand extends BaseCommand {
	private readonly callback: CommandCallback;
	private readonly guards: ReadonlyArray<CommandGuard>;

	constructor(
		config: ReadonlyDeep<SharedConfig>,
		registry: BaseRegistry,
		path: ImmutableRegistryPath,
		options: CommandOptions,
		callback: CommandCallback,
		guards: CommandGuard[],
	) {
		super(config, registry, path, options);
		this.callback = callback;
		this.guards = table.freeze([...guards]);
	}

	execute(context: CommandContext, args: string[]) {
		for (const guard of this.guards) {
			if (!guard(context)) return;
		}

		if (context.isReplyReceived()) return;

		const transformedArgs = this.transformArgs(args, context);
		if (!transformedArgs.ok) {
			context.error(transformedArgs.value);
			return;
		}

		return this.callback(context, ...transformedArgs.value);
	}

	transformArgs(
		args: string[],
		context: CommandContext,
	): TransformResult.Object<unknown[]> {
		const argOptions = this.options.arguments;
		if (argOptions === undefined || argOptions.isEmpty()) {
			return TransformResult.ok([]);
		}

		const endIndex = this.arguments.size() - 1;
		const transformedArgs: unknown[] = [];

		let argIndex = 0;
		for (const arg of this.arguments) {
			const argument = this.arguments[math.min(argIndex, endIndex)];
			const numArgs = argument.options.numArgs ?? 1;
			const isNum = numArgs !== "rest";
			const argInputs = ArrayUtil.slice(
				args,
				argIndex,
				isNum ? argIndex + numArgs : undefined,
			);

			if (argInputs.isEmpty()) {
				if (arg.options.optional) break;
				return TransformResult.err(
					`Missing required argument: <b>${arg.options.name}</b>`,
				);
			}

			if (isNum && argInputs.size() < numArgs) {
				return TransformResult.err(
					`Argument <b>${arg.options.name}</b> requires ${numArgs} argument(s), but only ${argInputs.size()} were provided`,
				);
			}

			const argValues: unknown[] = [];
			for (const i of $range(0, argInputs.size() - 1)) {
				let result: TransformResult.Object<unknown>;
				if (arg.type.kind === "single") {
					result = arg.type.transform(argInputs[i], context.executor);
				} else {
					result = arg.type.transform(
						splitString(argInputs[i], ","),
						context.executor,
					);
				}

				if (!result.ok) return TransformResult.err(result.value);
				argValues[i] = result.value;
			}

			transformedArgs[argIndex] =
				arg.options.numArgs !== undefined ? argValues : argValues[0];
			argIndex += 1;
		}

		return TransformResult.ok(transformedArgs);
	}

	toString() {
		return `ExecutableCommand{path=${this.path}}`;
	}
}

export class CommandGroup {
	private readonly commands = new Map<string, BaseCommand>();
	private readonly groups = new Map<string, CommandGroup>();
	private readonly logger: CenturionLogger;
	readonly options: ReadonlyDeep<GroupOptions>;

	constructor(
		config: ReadonlyDeep<SharedConfig>,
		readonly path: ImmutableRegistryPath,
		options: GroupOptions,
	) {
		this.options = options;
		this.logger = new CenturionLogger(config.logLevel, `CommandGroup/${path}`);
	}

	addCommand(command: BaseCommand) {
		if (!command.getPath().isChildOf(this.path)) {
			this.logger.error(`${command} is not a child of this group (${this})`);
			return;
		}

		const commandName = command.getName();
		if (this.hasCommand(commandName)) {
			this.logger.error(
				`There is already a command with the name '${commandName} in ${this}`,
			);
			return;
		}

		if (this.hasGroup(commandName)) {
			this.logger.error(
				`There is already a group with the same name as the command '${command}' in ${this}`,
			);
			return;
		}

		this.commands.set(commandName, command);
	}

	addGroup(group: CommandGroup) {
		if (group === this) {
			this.logger.error(`Cannot add group to itself (${this})`);
			return;
		}

		if (!group.getPath().isChildOf(this.path)) {
			this.logger.error(`${group} is not a child of this group (${this})`);
			return;
		}

		const groupName = group.options.name;
		if (this.hasGroup(groupName)) {
			this.logger.error(
				`There is already a group with the name '${groupName} in ${this}`,
			);
			return;
		}

		if (this.hasCommand(groupName)) {
			this.logger.error(
				`There is already a command with the same name as the group '${groupName}' in ${this}`,
			);
			return;
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
		const commandsArray: BaseCommand[] = [];
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
