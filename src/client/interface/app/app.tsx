import "./config";

import { createPortal, createRoot } from "@rbxts/react-roblox";
import Roact, { StrictMode, useMemo } from "@rbxts/roact";
import { Players } from "@rbxts/services";
import { InterfaceContext } from "../../types";
import { Layer } from "../components/interface/Layer";
import Terminal from "../components/terminal/Terminal";
import { DEFAULT_INTERFACE_OPTIONS } from "../constants/options";
import { RootProvider } from "../providers/rootProvider";
import { InterfaceOptions } from "../types";

interface TerminalAppProps {
	context: InterfaceContext;
	options: Partial<InterfaceOptions>;
}

function TerminalApp({ context, options = {} }: TerminalAppProps) {
	const optionsValue = useMemo(
		() => ({ ...DEFAULT_INTERFACE_OPTIONS, ...options }),
		[options],
	);

	return (
		<RootProvider key="root-provider" context={context} options={optionsValue}>
			<Layer key="terminal" displayOrder={optionsValue.displayOrder}>
				<Terminal key="terminal-layer" />
			</Layer>
		</RootProvider>
	);
}

export const CommanderInterface =
	(options: Partial<InterfaceOptions> = {}) =>
	(context: InterfaceContext) => {
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
