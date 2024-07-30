import { Centurion } from "../../..";
import { BaseRegistry } from "../../../shared";

export = (registry: BaseRegistry) => {
	registry.registerCommand(
		{
			name: "clear",
			description: "Clear the terminal",
			disableDefaultReply: true,
		},
		() => {
			Centurion.client().dispatcher.clearHistory();
		},
	);
};
