import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import { InterfaceContext } from "../../types";
import { store } from "../store";
import { InterfaceOptions } from "../types";
import { CommanderProvider } from "./commander-provider";
import { OptionsProvider } from "./options-provider";

interface RootProviderProps extends React.PropsWithChildren {
	context: InterfaceContext;
	options: InterfaceOptions;
	optionsChanged: RBXScriptSignal<(options: Partial<InterfaceOptions>) => void>;
}

export function RootProvider({
	context,
	options,
	optionsChanged,
	children,
}: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<CommanderProvider value={context}>
				<OptionsProvider value={options} changed={optionsChanged}>
					{children}
				</OptionsProvider>
			</CommanderProvider>
		</ReflexProvider>
	);
}
