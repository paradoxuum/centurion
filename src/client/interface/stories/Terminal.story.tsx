import Roact from "@rbxts/roact";
import { DEFAULT_OPTIONS } from "../../options";
import { HistoryEntry } from "../../types";
import Terminal from "../components/terminal/Terminal";
import { RootProvider } from "../providers/rootProvider";
import { story } from "../util/story";

export = story({
	summary: "Terminal UI",
	story: () => {
		const history: HistoryEntry[] = [];
		const historyEvent = new Instance("BindableEvent");

		return (
			<RootProvider
				data={{
					options: DEFAULT_OPTIONS,
					execute: async (path, text) => {
						const entry: HistoryEntry = {
							text: "Command executed.",
							success: true,
							sentAt: DateTime.now().UnixTimestamp,
						};
						history.push(entry);
						historyEvent.Fire(entry);
						return entry;
					},

					commands: new Map(),
					groups: new Map(),
					getArgumentSuggestions: () => [],
					getCommandSuggestions: () => [],
					history: history,
					onHistoryUpdated: historyEvent.Event,
				}}
			>
				<Terminal />
			</RootProvider>
		);
	},
});
