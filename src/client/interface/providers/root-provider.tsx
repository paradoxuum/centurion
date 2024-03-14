import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import { store } from "../store";
import { InterfaceOptions } from "../types";
import { OptionsProvider } from "./options-provider";

interface RootProviderProps extends React.PropsWithChildren {
	options: InterfaceOptions;
	optionsChanged: RBXScriptSignal<(options: Partial<InterfaceOptions>) => void>;
}

export function RootProvider({
	options,
	optionsChanged,
	children,
}: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<OptionsProvider value={options} changed={optionsChanged}>
				{children}
			</OptionsProvider>
		</ReflexProvider>
	);
}
