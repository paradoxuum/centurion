import { BaseRegistry, RegistryPath } from "@rbxts/centurion";
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
