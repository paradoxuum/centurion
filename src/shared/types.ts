import { Result } from "@rbxts/rust-classes";
import { t } from "@rbxts/t";
import { CommandInteraction } from "./core/interaction";

export type GuardFunction = (
	runNext: (interaction: CommandInteraction) => unknown,
	interaction: CommandInteraction,
) => boolean;

export interface CmdxOptions {
	groups?: GroupOptions[];
	globalGroups?: string[];
}

export type TransformationResult<T extends defined> = Result<T, string>;

export interface TypeOptions<T extends defined> {
	name: string;
	validate: t.check<T>;
	transform: (text: string) => TransformationResult<T>;
	suggestions?: (text: string) => string[];
}

export interface ArgumentOptions {
	name: string;
	description: string;
	type: string;
	optional?: boolean;
}

export interface CommandOptions {
	name: string;
	description?: string;
	arguments?: ArgumentOptions[];
}

export interface GroupOptions {
	name: string;
	description?: string;
	root?: string;
}

export interface CommandMetadata {
	options: CommandOptions;
	func: (...args: unknown[]) => unknown;
}

export interface CommandInteractionData {
	executor: Player;
	text: string;
	replySuccess?: boolean;
	replyText?: string;
	replyTime?: number;
}
