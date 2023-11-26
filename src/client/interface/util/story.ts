import ReactRoblox from "@rbxts/react-roblox";
import Roact from "@rbxts/roact";
import { ReturnControls, WithControls } from "@rbxts/ui-labs";

export function story<T extends ReturnControls>(story: WithControls<T>): WithControls<T> {
	return {
		...story,
		react: Roact,
		reactRoblox: ReactRoblox,
	};
}
