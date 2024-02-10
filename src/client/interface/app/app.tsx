import "./config";

import { createPortal, createRoot } from "@rbxts/react-roblox";
import Roact, { StrictMode, useMemo } from "@rbxts/roact";
import { Players } from "@rbxts/services";
import { AppContext } from "../../types";
import { Layer } from "../components/interface/Layer";
import Terminal from "../components/terminal/Terminal";
import { DEFAULT_APP_OPTIONS } from "../constants/options";
import { RootProvider } from "../providers/rootProvider";
import { AppOptions } from "../types";

interface TerminalAppProps {
	context: AppContext;
	options: Partial<AppOptions>;
}

function TerminalApp({ context, options = {} }: TerminalAppProps) {
	const optionsValue = useMemo(
		() => ({ ...DEFAULT_APP_OPTIONS, ...options }),
		[options],
	);

	print(optionsValue);
	return (
		<RootProvider key="root-provider" context={context} options={optionsValue}>
			<Layer key="terminal" displayOrder={optionsValue.displayOrder}>
				<Terminal key="terminal-layer" />
			</Layer>
		</RootProvider>
	);
}

export const CommanderApp =
	(options: Partial<AppOptions> = {}) =>
	(context: AppContext) => {
		const root = createRoot(new Instance("Folder"));
		const target = Players.LocalPlayer.WaitForChild("PlayerGui");

		root.render(
			createPortal(
				<StrictMode>
					<TerminalApp key="terminal" context={context} options={options} />
				</StrictMode>,
				target,
			),
		);
	};
