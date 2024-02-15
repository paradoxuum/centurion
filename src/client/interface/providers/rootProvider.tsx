import { ReflexProvider } from "@rbxts/react-reflex";
import Roact from "@rbxts/roact";
import { InterfaceContext } from "../../types";
import { store } from "../store";
import { InterfaceOptions } from "../types";
import { CommanderProvider } from "./commanderProvider";
import { OptionsProvider } from "./optionsProvider";

interface RootProviderProps extends Roact.PropsWithChildren {
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
			<CommanderProvider key="data-provider" value={context}>
				<OptionsProvider key="options-provider" value={options}>
					{children}
				</OptionsProvider>
			</CommanderProvider>
		</ReflexProvider>
	);
}
