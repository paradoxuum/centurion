import { CommandGuard, CommandMetadata, CommandOptions, CommanderOptions } from "../types";
import { Reflect } from "../util/reflect";

export enum MetadataKey {
	CommandHolder = "holder",
	Command = "command",
	Group = "group",
	Guard = "guard",
}

export function Commander(options?: CommanderOptions): ClassDecorator {
	return function (target) {
		Reflect.defineMetadata(target, MetadataKey.CommandHolder, options);
	};
}

export function Command(options: CommandOptions): MethodDecorator {
	return function (target, key) {
		const commandData: CommandMetadata = {
			options,
			func: target[key],
		};
		Reflect.defineMetadata(target, MetadataKey.Command, commandData, key);
	};
}

export function Group(...groups: string[]): MethodDecorator {
	return function (target, key) {
		Reflect.defineMetadata(target, MetadataKey.Group, groups, key);
	};
}

export function Guard(...guards: CommandGuard[]): MethodDecorator {
	return function (target, key) {
		Reflect.defineMetadata(target, MetadataKey.Guard, guards, key);
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecoratorTarget = Record<string, any>;

type ClassDecorator = (target: DecoratorTarget, propertyKey?: undefined, descriptor?: undefined) => void;

type MethodDecorator = <T>(
	target: DecoratorTarget,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<T>,
) => void;
