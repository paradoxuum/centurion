import { ReflexProvider } from "@rbxts/react-reflex";
import Roact from "@rbxts/roact";
import { InterfaceContext } from "../../types";
import { store } from "../store";
import { InterfaceOptions } from "../types";
import { CommanderProvider } from "./commanderProvider";
import { OptionsProvider } from "./optionsProvider";
import { RemProvider, RemProviderProps } from "./remProvider";

interface RootProviderProps extends RemProviderProps {
	context: InterfaceContext;
	options: InterfaceOptions;
}

export function RootProvider({
	baseRem,
	context,
	options,
	children,
}: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<RemProvider key="rem-provider" baseRem={baseRem}>
				<CommanderProvider key="data-provider" value={context}>
					<OptionsProvider key="options-provider" value={options}>
						{children}
					</OptionsProvider>
				</CommanderProvider>
			</RemProvider>
		</ReflexProvider>
	);
}
