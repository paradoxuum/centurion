import { CommanderServer } from "@rbxts/commander";
import { runTests } from "@rbxts/midori";

// Run unit tests
const getInstanceFromPath = (parts: string[]) => {
	let last: Instance = game;
	for (const part of parts) {
		const partInstance = last.FindFirstChild(part);
		if (partInstance === undefined) return undefined;
		last = partInstance;
	}
	return last;
};

const [root, parts] = $getModuleTree("@rbxts/commander");
const srcPath = getInstanceFromPath([root.ClassName, ...parts]);
if (srcPath !== undefined) runTests(srcPath);

// Start commander
CommanderServer.start((registry) => {
	const commandContainer = script.Parent!.WaitForChild("commands");
	registry.registerCommandsIn(commandContainer);
});
