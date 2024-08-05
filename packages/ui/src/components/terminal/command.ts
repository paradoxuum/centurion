import {
	BaseRegistry,
	ImmutableRegistryPath,
	RegistryPath,
} from "@rbxts/centurion";
import { BaseCommand } from "@rbxts/centurion/out/shared/core/command";
import { IS_EDIT } from "../../constants/util";

export function formatPartsAsPath(parts: string[]) {
	return parts.join("/");
}

export function getValidPath(registry: BaseRegistry, text: string[]) {
	if (text.size() === 0) return;

	const textPath = formatPartsAsPath(text);
	if (
		registry.getCommandByString(textPath) !== undefined ||
		registry.getGroupByString(textPath) !== undefined
	) {
		return ImmutableRegistryPath.fromString(textPath);
	}

	const path = RegistryPath.empty();
	for (const part of text) {
		path.append(part);

		if (
			registry.getCommand(path) === undefined &&
			registry.getGroup(path) === undefined &&
			registry.getChildPaths(path).isEmpty()
		) {
			path.remove(path.size() - 1);
			break;
		}
	}

	if (
		registry.getCommand(path) !== undefined ||
		registry.getGroup(path) !== undefined
	) {
		return ImmutableRegistryPath.fromPath(path);
	}
}

export function getArgumentNames(registry: BaseRegistry, path: RegistryPath) {
	if (IS_EDIT) return [];

	const command = registry.getCommand(path);
	if (command === undefined || command.options.arguments === undefined) {
		return [];
	}

	return command.options.arguments.map((arg) => arg.name);
}

export function getMissingArgs(command: BaseCommand, text: string[]) {
	if (
		command.options.arguments === undefined ||
		command.options.arguments.isEmpty()
	) {
		return [];
	}

	const lastPartIndex = text.size() - command.getPath().size() - 1;
	const missingArgs: string[] = [];

	let index = 0;
	for (const arg of command.options.arguments) {
		if (arg.optional) break;
		if (index > lastPartIndex) {
			missingArgs.push(arg.name);
		}
		index++;
	}

	return missingArgs;
}
