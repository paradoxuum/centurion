import Roact from "@rbxts/roact";
import { DEFAULT_OPTIONS } from "../../options";
import Terminal from "../components/terminal/Terminal";
import { RootProvider } from "../providers/rootProvider";
import { story } from "../util/story";

export = story({
	summary: "Terminal UI",
	story: () => {
		return (
			<RootProvider
				data={{
					options: DEFAULT_OPTIONS,
					commands: new Map(),
					groups: new Map(),
					history: [],
					onHistoryChanged: new Instance("BindableEvent").Event,
					getArgumentSuggestions: () => [],
					getCommandSuggestions: () => [],
				}}
			>
				<Terminal />
			</RootProvider>
		);
	},
});
