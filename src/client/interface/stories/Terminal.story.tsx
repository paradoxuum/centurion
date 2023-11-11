import Roact from "@rbxts/roact";
import Terminal from "../components/terminal/Terminal";
import { RootProvider } from "../providers/rootProvider";
import { story } from "../util/story";

export = story({
	summary: "Terminal UI",
	story: () => {
		return (
			<RootProvider>
				<Terminal />
			</RootProvider>
		);
	},
});
