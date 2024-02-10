import {
	CommandGuard,
	CommandMetadata,
	CommandOptions,
	CommanderOptions,
} from "../types";
import { MetadataReflect } from "../util/reflect";

export enum MetadataKey {
	CommandHolder = "holder",
	Command = "command",
	Group = "group",
	Guard = "guard",
}

export function Commander(options?: CommanderOptions): ClassDecorator {
	return (target) => {
		MetadataReflect.defineMetadata(target, MetadataKey.CommandHolder, options);
	};
}

export function Command(options?: Partial<CommandOptions>): MethodDecorator {
	return (target, key) => {
		const commandData: CommandMetadata = {
			options: {
				name: key,
				...options,
			},
			func: target[key],
		};
		MetadataReflect.defineMetadata(
			target,
			MetadataKey.Command,
			commandData,
			key,
		);
	};
}

export function Group(...groups: string[]): MethodDecorator {
	return (target, key) => {
		MetadataReflect.defineMetadata(target, MetadataKey.Group, groups, key);
	};
}

export function Guard(...guards: CommandGuard[]): MethodDecorator {
	return (target, key) => {
		MetadataReflect.defineMetadata(target, MetadataKey.Guard, guards, key);
	};
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type DecoratorTarget = Record<string, any>;

type ClassDecorator = (
	target: DecoratorTarget,
	propertyKey?: undefined,
	descriptor?: undefined,
) => void;

type MethodDecorator = <T>(
	target: DecoratorTarget,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<T>,
) => void;
