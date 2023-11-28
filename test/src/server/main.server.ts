import { CommanderServer } from "@rbxts/commander";

CommanderServer.start((registry) => {
	const commandContainer = script.Parent!.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
});
