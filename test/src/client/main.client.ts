import { CommanderClient } from "@rbxts/commander";
import { defaultApp } from "./interface";

CommanderClient.run(
	(registry) => {
		const commandContainer = script.Parent!.WaitForChild("commands");
		registry.registerCommandsIn(commandContainer);
	},
	{
		app: defaultApp,
	},
).catch((err) => {
	warn(`An error occurred and Commander could not be started: ${err}`);
});
