import Roact, { createContext, useState } from "@rbxts/roact";
import { InterfaceOptions } from "../types";

export interface InterfaceOptionsWithState extends InterfaceOptions {
	isMouseOnGUI: boolean;
	setMouseOnGUI: (newState: boolean) => void;
}

// we can safely assign to {} as the value will always be assigned in the provider
export const OptionsContext = createContext<InterfaceOptionsWithState>(
	{} as never,
);

export interface OptionsProviderProps extends Roact.PropsWithChildren {
	value: InterfaceOptions;
}

export function OptionsProvider({ value, children }: OptionsProviderProps) {
	const [isMouseOnGUI, setMouseOnGUI] = useState(false);

	return (
		<OptionsContext.Provider value={{ ...value, isMouseOnGUI, setMouseOnGUI }}>
			{children}
		</OptionsContext.Provider>
	);
}
