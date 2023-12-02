import { CommandPath } from "../../../shared";
import { CommanderClient } from "../../core";
import { IS_EDIT } from "../constants/util";

export function getArgumentNames(path: CommandPath) {
	if (IS_EDIT) {
		return [];
	}

	const command = CommanderClient.registry().getCommand(path);
	if (command === undefined || command.options.arguments === undefined)
		return [];

	return command.options.arguments.map((arg) => arg.name);
}
