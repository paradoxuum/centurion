import { CenturionClient } from "@rbxts/centurion";
import { CenturionUI } from "@rbxts/centurion-ui";

CenturionClient.start(
	(registry) => {
		if (script.Parent === undefined) return;
		const commandContainer = script.Parent.WaitForChild("commands");
		registry.load(commandContainer);
		registry.register();
	},
	{
		interface: CenturionUI.create({
			showShortcutSuggestions: true,
		}),
	},
)
	.catch((err) => {
		warn(`An error occurred and Centurion could not be started: ${err}`);
	})
	.await();
