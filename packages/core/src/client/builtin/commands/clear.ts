import { BaseRegistry } from "../../../shared";
import { CenturionClient } from "../../core";

export = (registry: BaseRegistry) => {
	registry.registerCommand(
		{
			name: "clear",
			description: "Clear the terminal",
			disableDefaultReply: true,
		},
		() => {
			CenturionClient.dispatcher().clearHistory();
		},
	);
};
