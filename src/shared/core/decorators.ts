import { ClassDecorator, CmdxOptions, CommandMetadata, CommandOptions, GuardFunction, MethodDecorator } from "../types";
import { Reflect } from "../util/reflect";

export enum MetadataKey {
	CommandHolder = "holder",
	Command = "command",
	Group = "group",
	Guard = "guard",
}

export function Cmdx(options?: CmdxOptions): ClassDecorator {
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

export function Guard(...guards: GuardFunction[]): MethodDecorator {
	return function (target, key) {
		Reflect.defineMetadata(target, MetadataKey.Guard, guards, key);
	};
}
