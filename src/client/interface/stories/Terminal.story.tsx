import Roact from "@rbxts/roact";
import Terminal from "../components/terminal/Terminal";
import { RootProvider } from "../providers/rootProvider";
import { story } from "../util/story";

export = story({
	summary: "Terminal UI",
	story: () => {
		const historyTime = DateTime.now().UnixTimestamp;
		return (
			<RootProvider
				data={{
					history: [
						{
							sentAt: historyTime,
							text: "History entry",
						},
						{
							sentAt: historyTime,
							text: "History entry 2\nLine 2\nLine 3",
						},
					],
					getCommandSuggestions: () => [],
					getArgumentSuggestions: () => [],
				}}
			>
				<Terminal />
			</RootProvider>
		);
	},
});
