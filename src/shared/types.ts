import { t } from "@rbxts/t";
import { CommandInteraction } from "./core/interaction";
import { TransformationResult } from "./response";

export type GuardFunction = (
	runNext: (interaction: CommandInteraction) => unknown,
	interaction: CommandInteraction,
) => void;

export interface CmdxOptions {
	groups?: GroupOptions[];
	globalGroups?: string[];
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DecoratorTarget = Record<string, any>;

export type ClassDecorator = (target: DecoratorTarget, propertyKey?: undefined, descriptor?: undefined) => void;

export type PropertyDecorator = (target: DecoratorTarget, propertyKey: string, descriptor?: undefined) => void;

export type MethodDecorator = <T>(
	target: DecoratorTarget,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<T>,
) => void;

export type ParameterDecorator = (target: DecoratorTarget, propertyKey: string, parameterIndex: number) => void;

export type ClassMethodDecorator = <T>(
	target: DecoratorTarget,
	propertyKey?: string,
	descriptor?: TypedPropertyDescriptor<T>,
) => void;
