import "./config";

import { createPortal, createRoot } from "@rbxts/react-roblox";
import Roact, { StrictMode } from "@rbxts/roact";
import { Players } from "@rbxts/services";
import { AppData } from "../../types";
import { Layer } from "../components/interface/Layer";
import Terminal from "../components/terminal/Terminal";
import { RootProvider } from "../providers/rootProvider";
import { SuggestionQuery } from "../types";
import { getArgumentSuggestion, getCommandSuggestion } from "./suggestion";

function getSuggestion(query: SuggestionQuery) {
	if (query.type === "argument") {
		return getArgumentSuggestion(query.commandPath, query.index, query.text);
	}

	return getCommandSuggestion(query.parentPath, query.text);
}

export function defaultApp(data: AppData) {
	const root = createRoot(new Instance("Folder"));
	const target = Players.LocalPlayer.WaitForChild("PlayerGui");

	root.render(
		createPortal(
			<StrictMode>
				<RootProvider key="root-provider" data={data} getSuggestion={getSuggestion}>
					<Layer key="terminal">
						<Terminal key="terminal-layer" />
					</Layer>
				</RootProvider>
			</StrictMode>,
			target,
		),
	);
}
