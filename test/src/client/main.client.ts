import { CommanderClient, CommanderInterface } from "@rbxts/commander";

CommanderClient.start(
	(registry) => {
		if (script.Parent === undefined) return;
		const commandContainer = script.Parent.WaitForChild("commands");
		registry.load(commandContainer);
		registry.register();
	},
	{
		interface: CommanderInterface.create({
			showShortcutSuggestions: true,
		}),
	},
)
	.catch((err) => {
		warn(`An error occurred and Commander could not be started: ${err}`);
	})
	.await();
