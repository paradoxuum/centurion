import { CmdxClient } from ".";
import { defaultApp } from "./interface";

CmdxClient.run(
	(registry) => {
		const commandContainer = script.Parent!.WaitForChild("commands");
		registry.registerCommandsIn(commandContainer);
	},
	{
		app: defaultApp,
	},
).catch((err) => {
	warn(`An error occurred and Cmdx could not be started: ${err}`);
});
