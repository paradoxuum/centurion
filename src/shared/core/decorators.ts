import { CommandGuard, CommandMetadata, CommandOptions } from "../types";
import { MetadataReflect } from "../util/reflect";

export enum MetadataKey {
	CommandClass = "class",
	Type = "type",
	Command = "command",
	Group = "group",
	Guard = "guard",
	Shortcut = "shortcut",
}

export function Commander(target: new () => object) {
	MetadataReflect.defineMetadata(target, MetadataKey.CommandClass, true);
}

export function Command(options?: Partial<CommandOptions>) {
	return (target: unknown, key: string) => {
		const commandData: CommandMetadata = {
			options: {
				name: key,
				...options,
			},
			func: (target as Record<string, unknown>)[key] as never,
		};
		MetadataReflect.defineMetadata(
			target as never,
			MetadataKey.Command,
			commandData,
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
