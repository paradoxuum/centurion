import { CommanderApp, CommanderClient } from "@rbxts/commander";

CommanderClient.start(
	(registry) => {
		if (script.Parent === undefined) return;
		const commandContainer = script.Parent.WaitForChild("commands");
		registry.register(commandContainer);
	},
	{
		app: CommanderApp,
	},
).catch((err) => {
	warn(`An error occurred and Commander could not be started: ${err}`);
});
