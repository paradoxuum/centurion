import { BindingOrValue, getBindingValue } from "@rbxts/pretty-react-hooks";
import Roact, { createContext, useState } from "@rbxts/roact";
import { AppData } from "../../types";
import { AppContext } from "../types/data";

export interface DataProviderProps extends Roact.PropsWithChildren {
	data: BindingOrValue<AppData>;
}

export const DEFAULT_DATA: AppContext = {
	history: [],
	text: "",
	setText: () => {},
};

export const DataContext = createContext(DEFAULT_DATA);

export function DataProvider({ data, children }: DataProviderProps) {
	const [text, setText] = useState("");

	return (
		<DataContext.Provider
			value={{
				...getBindingValue(data),
				text,
				setText,
			}}
		>
			{children}
		</DataContext.Provider>
	);
}
