declare const _G: Map<unknown, unknown>;

_G.set("NOCOLOR", true);

import { runCLI } from "@rbxts/jest";
import { ReplicatedStorage } from "@rbxts/services";

function getTests(root: Instance) {
	const folder = root.WaitForChild("TS").WaitForChild("__tests__");
	assert(
		classIs(folder, "Folder"),
		"Could not find __tests__ folder in ReplicatedStorage.TS",
	);
	return folder;
}

const setup = script.Parent?.WaitForChild("setup");
assert(
	setup !== undefined && classIs(setup, "ModuleScript"),
	"Could not find setup module script",
);

const [status, result] = runCLI(
	script,
	{
		verbose: false,
		ci: false,
		setupFiles: [setup],
	},
	[getTests(ReplicatedStorage)],
).awaitStatus();

if (status === "Rejected") {
	print(result);
}
