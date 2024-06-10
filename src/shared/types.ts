import { t } from "@rbxts/t";
import { CommandContext } from "./core/context";
import { TransformResult } from "./util/type";

export type CommandGuard = (context: CommandContext) => boolean;

export interface ArgumentType<T> {
	name: string;
	expensive: boolean;
	validate: t.check<T>;
	transform: (text: string, executor?: Player) => TransformResult.Object<T>;
	suggestions?: (text: string, executor?: Player) => string[];
}

export interface ArgumentOptions {
	name: string;
	description: string;
	type: string;
	optional?: boolean;
	suggestions?: string[];
}

export type Shortcut = Array<Enum.KeyCode | Enum.KeyCode[]>;

export interface CommandOptions {
	name: string;
	aliases?: string[];
	description?: string;
	arguments?: ArgumentOptions[];
	shortcuts?: Shortcut;
}

export interface GroupOptions {
	name: string;
	description?: string;
	parent?: string[];
}

export interface CommandMetadata {
	options: CommandOptions;
	func: (...args: unknown[]) => unknown;
}

export interface CommandReply {
	success: boolean;
	text: string;
	sentAt: number;
}

export interface CommandContextData {
	executor?: Player;
	text: string;
	reply?: CommandReply;
}
