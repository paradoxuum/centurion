import { Signal } from "@rbxts/beacon";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import { store } from "../store";
import { InterfaceOptions } from "../types";
import { OptionsProvider } from "./options-provider";

interface RootProviderProps extends React.PropsWithChildren {
	options: InterfaceOptions;
	optionsChanged: Signal<[options: Partial<InterfaceOptions>]>;
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
