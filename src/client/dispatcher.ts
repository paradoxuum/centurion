import { Players } from "@rbxts/services";
import { CommandPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { ClientRegistry } from "./registry";

export class ClientDispatcher extends BaseDispatcher {
	constructor(registry: ClientRegistry) {
		super(registry);
	}

	run(path: CommandPath, text: string) {
		this.executeCommand(path, Players.LocalPlayer, text);
	}
}
