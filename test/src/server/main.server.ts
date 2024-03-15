import { CommanderServer } from "@rbxts/commander";

// Start commander
CommanderServer.start((registry) => {
	registry.registerGroups({
		name: "info",
		description: "View info about a user or the server",
	});

	if (script.Parent === undefined) return;
	const commandContainer = script.Parent.WaitForChild("commands");
	registry.register(commandContainer);
});
