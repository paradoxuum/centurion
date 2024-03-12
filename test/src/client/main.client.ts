import { CommanderClient, CommanderInterface } from "@rbxts/commander";

CommanderClient.start(
	(registry) => {
		registry.registerGroups(
			{
				name: "info",
				description: "View info about a user or the server",
			},
			{
				name: "user",
				description: "View info about a user",
				root: "info",
			},
			{
				name: "server",
				description: "View info about the server",
				root: "info",
			},
		);

		if (script.Parent === undefined) return;
		const commandContainer = script.Parent.WaitForChild("commands");
		registry.register(commandContainer);
	},
	{
		interface: CommanderInterface.create(),
	},
).catch((err) => {
	warn(`An error occurred and Commander could not be started: ${err}`);
});
