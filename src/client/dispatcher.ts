import { Players } from "@rbxts/services";
import { CommandPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { ClientRegistry } from "./registry";

export class ClientDispatcher extends BaseDispatcher {
	constructor(registry: ClientRegistry) {
		super(registry);
	}

	async run(path: CommandPath, text: string = "") {
		return this.executeCommand(path, Players.LocalPlayer, text).catch((err) => {
			warn(`An error occurred while running '${path}': ${err}`);
			throw err;
		});
	}
}
