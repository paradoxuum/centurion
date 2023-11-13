import { CmdxClient } from ".";

CmdxClient.run((registry) => {
	const commandContainer = script.Parent!.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
}).catch((err) => {
	warn(`An error occurred and Cmdx could not be started: ${err}`);
});
