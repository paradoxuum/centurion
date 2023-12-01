import { CommanderServer } from "@rbxts/commander";

// Start commander
CommanderServer.start((registry) => {
	const commandContainer = script.Parent!.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
});
