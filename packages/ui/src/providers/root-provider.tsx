import { Signal } from "@rbxts/beacon";
import { ClientAPI } from "@rbxts/centurion";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import { store } from "../store";
import { InterfaceOptions } from "../types";
import { ApiProvider } from "./api-provider";
import { OptionsProvider } from "./options-provider";

interface RootProviderProps extends React.PropsWithChildren {
	api: ClientAPI;
	options: InterfaceOptions;
	optionsChanged: Signal<[options: Partial<InterfaceOptions>]>;
}

export function RootProvider({
	api,
	options,
	optionsChanged,
	children,
}: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<ApiProvider api={api}>
				<OptionsProvider value={options} changed={optionsChanged}>
					{children}
				</OptionsProvider>
			</ApiProvider>
		</ReflexProvider>
	);
}
