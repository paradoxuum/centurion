import { CommandGuard, CommandOptions, RegisterOptions } from "../types";
import { MetadataReflect } from "../util/reflect";

export enum MetadataKey {
	Register = "register",
	Type = "type",
	Command = "command",
	Group = "group",
	Guard = "guard",
}

export function Register(options?: Partial<RegisterOptions>) {
	return (target: new () => object) => {
		MetadataReflect.defineMetadata(target, MetadataKey.Register, {
			groups: [],
			...options,
		} satisfies RegisterOptions);
	};
}

export function Command(options?: Partial<CommandOptions>) {
	return (target: unknown, key: string) => {
		MetadataReflect.defineMetadata(
			target as never,
			MetadataKey.Command,
			{
				name: key,
				...options,
			} satisfies CommandOptions,
			key,
		);
	};
}

export function Group(...groups: string[]) {
	return (target: unknown, key?: string) => {
		MetadataReflect.defineMetadata(
			target as never,
			MetadataKey.Group,
			groups,
			key,
		);
	};
}

export function Guard(...guards: CommandGuard[]) {
	return (target: unknown, key?: string) => {
		MetadataReflect.defineMetadata(
			target as never,
			MetadataKey.Guard,
			guards,
			key,
		);
	};
}
