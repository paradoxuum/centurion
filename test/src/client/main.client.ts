import { CmdxClient } from ".";
import { defaultApp } from "./interface/app/app";

CmdxClient.run(
	(registry) => {
		const commandContainer = script.Parent!.WaitForChild("commands");
		registry.registerCommandsIn(commandContainer);
	},
	{
		app: defaultApp,
	},
);
