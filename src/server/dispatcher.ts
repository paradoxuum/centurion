import { CommandPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { remotes } from "../shared/network";
import { ServerRegistry } from "./registry";

export class ServerDispatcher extends BaseDispatcher {
	constructor(registry: ServerRegistry) {
		super(registry);
	}

	init() {
		remotes.executeCommand.connect((player, path, text) => {
			// const args = text.split(" ");
			print(`Run command '${path}' with args '${text}'`);
		});
	}

	run(path: CommandPath, executor: Player, text: string) {
		this.executeCommand(path, executor, text);
	}
}
