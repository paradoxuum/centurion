import { CommanderServer } from "@rbxts/commander";

// Start commander
CommanderServer.start((registry) => {
	if (script.Parent === undefined) return;
	const commandContainer = script.Parent.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
});
