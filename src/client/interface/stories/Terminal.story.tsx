import Roact from "@rbxts/roact";
import { HistoryEntry } from "../../types";
import Terminal from "../components/terminal/Terminal";
import { RootProvider } from "../providers/rootProvider";
import { story } from "../util/story";

export = story({
	summary: "Terminal UI",
	story: () => {
		const historyTime = DateTime.now().UnixTimestamp;
		const historyEntries: HistoryEntry[] = [];
		for (let i = 0; i < 15; i++) {
			historyEntries.push({
				text: `Line ${i + 1}`,
				sentAt: historyTime + i * 60,
			});
		}

		return (
			<RootProvider
				data={{
					history: historyEntries,
					getCommandSuggestions: () => [],
					getArgumentSuggestions: () => [],
				}}
			>
				<Terminal />
			</RootProvider>
		);
	},
});
