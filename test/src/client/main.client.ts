import { CommanderApp, CommanderClient } from "@rbxts/commander";

CommanderClient.start(
	(registry) => {
		const commandContainer = script.Parent!.WaitForChild("commands");
		registry.registerCommandsIn(commandContainer);
	},
	{
		app: CommanderApp,
	},
).catch((err) => {
	warn(`An error occurred and Commander could not be started: ${err}`);
});
