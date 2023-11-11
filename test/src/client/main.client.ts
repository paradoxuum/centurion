import { CmdxClient } from ".";

CmdxClient.run((registry) => {
	const commandContainer = script.Parent!.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
});
