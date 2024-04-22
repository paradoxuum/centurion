import { test } from "@rbxts/jest-globals";
import { CommandInteraction } from "../core/interaction";
import { RegistryPath } from "../core/path";

test("interactions can be replied to", () => {
	const interaction = new CommandInteraction(
		RegistryPath.fromString("test"),
		"test",
	);
	interaction.reply("test");
});
