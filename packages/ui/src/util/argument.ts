import {
	BaseRegistry,
	ImmutableRegistryPath,
	RegistryPath,
} from "@rbxts/centurion";
import { IS_EDIT } from "../constants/util";

export function getArgumentNames(registry: BaseRegistry, path: RegistryPath) {
	if (IS_EDIT) {
		return [];
	}

	const command = registry.getCommand(path);
	if (command === undefined || command.options.arguments === undefined) {
		return [];
	}

	return command.options.arguments.map((arg) => arg.name);
}

export function getMissingArgs(
	registry: BaseRegistry,
	path: ImmutableRegistryPath,
	text: string[],
) {
	const commandOptions = registry.getCommand(path)?.options;
	if (
		commandOptions === undefined ||
		commandOptions.arguments === undefined ||
		commandOptions.arguments.isEmpty()
	) {
		return [];
	}

	const lastPartIndex = text.size() - path.size() - 1;
	const missingArgs: string[] = [];

	let index = 0;
	for (const arg of commandOptions.arguments) {
		if (arg.optional) break;
		if (index > lastPartIndex) {
			missingArgs.push(arg.name);
		}
		index++;
	}

	return missingArgs;
}
