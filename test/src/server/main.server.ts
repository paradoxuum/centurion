import { CmdxServer } from "@rbxts/cmdx";

CmdxServer.run((registry) => {
	const commandContainer = script.Parent!.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
});
