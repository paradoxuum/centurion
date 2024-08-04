import { CommandGuard, CommandOptions, RegisterOptions } from "../types";
import { DecoratorMetadata, MetadataKey } from "./metadata";

export function Register(options?: Partial<RegisterOptions>) {
	return (target: new () => object) => {
		DecoratorMetadata.defineMetadata(target, MetadataKey.Register, {
			groups: [],
			...options,
		} satisfies RegisterOptions);
	};
}

export function Command(options?: Partial<CommandOptions>) {
	return (target: unknown, key: string) => {
		DecoratorMetadata.defineMetadata(
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
		DecoratorMetadata.defineMetadata(
			target as never,
			MetadataKey.Group,
			groups,
			key,
		);
	};
}

export function Guard(...guards: CommandGuard[]) {
	return (target: unknown, key?: string) => {
		DecoratorMetadata.defineMetadata(
			target as never,
			MetadataKey.Guard,
			guards,
			key,
		);
	};
}
