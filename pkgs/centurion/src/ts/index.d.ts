export interface Argument {
	name: string;
	type: string;
	optional?: boolean;
	description?: string;
	num_args?: number | "rest";
	suggestions?: string[];
}

export interface CommandData<T extends unknown[]> {
	description?: string;
	arguments?: () => LuaTuple<[...T]>;
	callback: (ctx: ExecutionContext, ...args: T) => any;
	guards?: (string | GuardCallback)[];
	roles?: string[];
	permissions?: string[];
}

export interface Ok<T> {
	success: true;
	value: T;
}

export interface Err {
	success: false;
	error: string;
}

export type Result<T> = Ok<T> | Err;

export interface Response {
	success: boolean;
	message: string;
	timestamp: number;
}

export interface ExecutionContext {
	executor: Player;
	command: string;
	input: string;
	arguments: string[];
	response?: Response;

	reply: (message: string) => void;
	error: (message: string) => void;
}

export type GuardCallback = (context: ExecutionContext) => boolean;

export type PermissionRole = {
	name: string;
	priority: number;
	permissions: Set<string>;
};

export interface SingleArgumentType<T> {
	kind: "single";
	transform: (text: string, executor: Player) => Result<T>;
	suggestions?: (text: string, executor: Player) => string[] | undefined;
}

export interface ListArgumentType<T> {
	kind: "list";
	transform: (texts: string[], executor: Player) => Result<T>;
	suggestions?: (text: string, executor: Player) => string[] | undefined;
}

export type ArgumentType<T> = SingleArgumentType<T> | ListArgumentType<T>;

export type ArgumentFn<T> = (name: string, description?: string, suggestions?: string[]) => T;

export function Command(options: {
	name?: string;
	description?: string;
	arguments?: () => unknown[];
	guards?: Array<string | GuardCallback>;
	roles?: string[];
	permissions?: string[];
}): (target: unknown, key: string) => void;

export function Group(...groups: string[]): (target: unknown, key?: string) => void;

export function Guard(...guards: Array<string | GuardCallback>): (target: unknown, key?: string) => void;

export function Role(...roles: string[]): (target: unknown, key?: string) => void;

export function Permission(...permissions: string[]): (target: unknown, key?: string) => void;

export function register_classes(): void;

export function register_command<const T extends unknown[]>(
	name: string,
	command: {
		description?: string;
		arguments?: () => [...T];
		callback: (ctx: ExecutionContext, ...args: T) => any;
		guards?: (string | GuardCallback)[];
		roles?: string[];
		permissions?: string[];
	},
): void;

export function register_guard(name: string, guard: GuardCallback): void;

export function register_type<T>(name: string, argumentFn: Omit<SingleArgumentType<T>, "kind">): T;

export function register_list_type<T>(name: string, argumentFn: Omit<ListArgumentType<T>, "kind">): T[];

export function unregister_command(name: string): void;

export function create_enum<T>(name: string, values: string[]): Omit<SingleArgumentType<T>, "kind">;

export function optional<T>(arg: T): T | undefined;

export function num_args<T>(arg: T, count: number | "rest"): T[];

export function transform_args(executor: Player, input: string[], args: ArgumentType<unknown>[]): Result<unknown[]>;

export function execute_command(executor: Player, command: string, args: string[]): Response;

export function set_network_handler(handler: (command: string, args?: string[]) => ExecutionContext): void;

export function create_role(name: string, priority: number, permissions?: string[]): void;

export function set_roles(player: Player, roles: string[]): void;

export function add_roles(player: Player, ...roles: string[]): void;

export function remove_roles(player: Player, ...roles: string[]): void;

export function get_roles(player: Player): string[];

export function can_execute(player: Player, command: CommandData<unknown[]>): boolean;

export function setup_networking(): void;

export const registry: {
	commands: Record<string, CommandData<unknown[]>>;
	types: Record<string, ArgumentType<unknown>>;
	guards: Record<string, GuardCallback>;
	global_guards: GuardCallback[];
	roles: Record<string, PermissionRole>;
};

export const args: {
	string: ArgumentFn<string>;
	boolean: ArgumentFn<boolean>;
	number: ArgumentFn<number>;
	integer: ArgumentFn<number>;
	player: ArgumentFn<Player>;
	players: ArgumentFn<Player[]>;
	brick_color: ArgumentFn<BrickColor>;
	hex_color: ArgumentFn<Color3>;
	team: ArgumentFn<Team>;
	duration: ArgumentFn<number>;
};

export const events: {
	on_command_register: (name: string, command: CommandData<unknown[]>) => () => void;
	on_command_unregister: (name: string, command: CommandData<unknown[]>) => () => void;
	on_command_execute: (ctx: ExecutionContext) => () => void;
	on_roles_changed: (player: Player, roles: string[]) => () => void;
};
