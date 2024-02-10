import Roact, { createContext } from "@rbxts/roact";
import { DEFAULT_INTERFACE_OPTIONS } from "../constants/options";
import { InterfaceOptions } from "../types";

export const OptionsContext = createContext<InterfaceOptions>(
	DEFAULT_INTERFACE_OPTIONS,
);

export interface OptionsProviderProps extends Roact.PropsWithChildren {
	value: InterfaceOptions;
}

export function OptionsProvider({ value, children }: OptionsProviderProps) {
	return (
		<OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>
	);
}
