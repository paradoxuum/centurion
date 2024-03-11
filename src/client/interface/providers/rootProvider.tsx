import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import { InterfaceContext } from "../../types";
import { store } from "../store";
import { InterfaceOptions } from "../types";
import { CommanderProvider } from "./commanderProvider";
import { OptionsProvider } from "./optionsProvider";

interface RootProviderProps extends React.PropsWithChildren {
	context: InterfaceContext;
	options: InterfaceOptions;
}

export function RootProvider({
	context,
	options,
	children,
}: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<CommanderProvider value={context}>
				<OptionsProvider value={options}>{children}</OptionsProvider>
			</CommanderProvider>
		</ReflexProvider>
	);
}
