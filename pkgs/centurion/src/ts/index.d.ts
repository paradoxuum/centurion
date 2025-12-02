export interface Argument {
	name: string;
	type: string;
	optional?: boolean;
	description?: string;
	num_args?: number | "rest";
	suggestions?: string[];
}

export interface Command<T extends unknown[]> {
	description?: string;
	guards?: (string | Guard)[];
	arguments: () => LuaTuple<[...T]>;
	callback: (ctx: ExecutionContext, ...args: T) => any;
}

export interface Ok {
	success: true;
	value: any;
}

export interface Err {
	success: false;
	error: string;
}

export type Result = Ok | Err;

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

export type Guard = (context: ExecutionContext) => boolean;

export interface ArgumentType {
	transform: (text: string, executor: Player) => Result;
	suggestions?: (text: string, executor: Player) => string[] | undefined;
}

export type ArgumentFn<T> = (name: string, description?: string, suggestions?: string[]) => T;

export interface ClassOptions {
	group: string[];
	guards?: Array<string | Guard>;
}

export interface CommandOptions {
	name?: string;
	description?: string;
	arguments?: () => unknown[];
	guards?: Array<string | Guard>;
}

export function Centurion(options?: ClassOptions): (target: unknown) => void;

export function Command(options: CommandOptions): (target: unknown, key: string) => void;

export function Group(...groups: string[]): (target: unknown, key?: string) => void;

export function Guard(...guards: Array<string | Guard>): (target: unknown, key?: string) => void;

export function register_classes(): void;

export function register_command<const T extends unknown[]>(name: string, command: Command<T>): void;

export function register_guard(name: string, guard: Guard): void;

export function register_type<T>(name: string, argumentFn: ArgumentType): void;

export function unregister_command(name: string): void;

export function create_enum(name: string, values: string[]): ArgumentType;

export function optional<T>(arg: T): T | undefined;

export function num_args<T>(arg: T, count: number | "rest"): T[];

export function transform_args(executor: Player, input: string[], args: ArgumentType[]): Result;

export function execute_command(executor: Player, command: string, args: string[]): Response;

export function set_network_handler(handler: (command: string, args?: string[]) => ExecutionContext): void;

export function setup_networking(): void;

export const registry: {
	commands: Record<string, Command<unknown[]>>;
	types: Record<string, ArgumentType>;
	guards: Record<string, Guard>;
	global_guards: Guard[];
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
	on_command_register: (name: string, command: Command<unknown[]>) => () => void;
	on_command_unregister: (name: string, command: Command<unknown[]>) => () => void;
	on_command_execute: (ctx: ExecutionContext) => () => void;
};
