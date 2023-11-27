import { CommanderServer } from "@rbxts/commander";

CommanderServer.run((registry) => {
	const commandContainer = script.Parent!.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
});
