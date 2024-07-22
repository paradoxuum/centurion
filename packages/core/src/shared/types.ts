import { t } from "@rbxts/t";
import { CommandContext } from "./core/context";
import { TransformResult } from "./util/type";

export type CommandCallback = (
	context: CommandContext,
	...args: unknown[]
) => void;

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

export interface ShortcutContext {
	keys: Enum.KeyCode[];
	arguments?: string[];
}

export type CommandShortcut = Enum.KeyCode | Enum.KeyCode[] | ShortcutContext;

export interface CommandOptions {
	name: string;
	aliases?: string[];
	description?: string;
	arguments?: ArgumentOptions[];
	shortcuts?: CommandShortcut[];
	disableDefaultReply?: boolean;
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
	args: string[];
	input: string;
	executor?: Player;
	reply?: CommandReply;
}
