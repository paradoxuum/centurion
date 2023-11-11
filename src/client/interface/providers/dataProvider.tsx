import { BindingOrValue, getBindingValue } from "@rbxts/pretty-react-hooks";
import Roact, { createContext } from "@rbxts/roact";
import { AppData } from "../../types";

export interface DataProviderProps extends Roact.PropsWithChildren {
	data: BindingOrValue<AppData>;
}

export const DEFAULT_DATA: AppData = {
	history: [],
};

export const DataContext = createContext(DEFAULT_DATA);

export function DataProvider({ data, children }: DataProviderProps) {
	return <DataContext.Provider value={getBindingValue(data)}>{children}</DataContext.Provider>;
}
