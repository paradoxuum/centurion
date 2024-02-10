import Roact, { createContext } from "@rbxts/roact";
import { DEFAULT_APP_OPTIONS } from "../constants/options";
import { AppOptions } from "../types";

export const OptionsContext = createContext<AppOptions>(DEFAULT_APP_OPTIONS);

export interface OptionsProviderProps extends Roact.PropsWithChildren {
	value: AppOptions;
}

export function OptionsProvider({ value, children }: OptionsProviderProps) {
	return (
		<OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>
	);
}
