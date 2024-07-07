import { CenturionServer } from "@rbxts/centurion";

// Start Centurion
CenturionServer.start((registry) => {
	registry.registerGroup(
		{
			name: "info",
			description: "View info about a user or the server",
		},
		{
			name: "user",
			description: "View info about a user",
			parent: ["info"],
		},
		{
			name: "server",
			description: "View info about the server",
			parent: ["info"],
		},
	);

	if (script.Parent === undefined) return;
	const commandContainer = script.Parent.WaitForChild("commands");
	registry.load(commandContainer);
	registry.register();
});
