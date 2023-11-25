import { CmdxClient } from "../..";
import { CommandPath } from "../../../shared";
import { IS_EDIT } from "../constants/util";

export function getArgumentNames(path: CommandPath) {
	if (IS_EDIT) {
		return [];
	}

	const command = CmdxClient.registry().getCommand(path);
	if (command === undefined || command.options.arguments === undefined) return [];

	return command.options.arguments.map((arg) => arg.name);
}
