import { $package } from "rbxts-transform-debug";
import { BaseRegistry } from "../../../shared";

export = (registry: BaseRegistry) => {
	registry.registerGroup({
		name: "centurion",
		description: "Commands relating to Centurion",
	});

	const version = $package.version;
	registry.registerCommand(
		{
			name: "version",
			description: "Display the current version of Centurion",
		},
		(ctx) => {
			ctx.reply(`Centurion v${version}`);
		},
		["centurion"],
	);
};
