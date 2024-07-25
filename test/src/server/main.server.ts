import { Centurion } from "@rbxts/centurion";

// Start Centurion
Centurion.server().start((registry) => {
	if (script.Parent === undefined) return;
	const commandContainer = script.Parent.WaitForChild("commands");
	registry.load(commandContainer);
	registry.register();
});
