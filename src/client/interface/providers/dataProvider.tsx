import Roact, { createContext, useEffect } from "@rbxts/roact";
import { DEFAULT_HISTORY_LENGTH, DEFAULT_OPTIONS } from "../../options";
import { AppData } from "../../types";
import { useStore } from "../hooks/useStore";
import { AppContext } from "../types/data";

export interface DataProviderProps extends Roact.PropsWithChildren {
	data: AppData;
}

export const DEFAULT_DATA: AppContext = {
	options: DEFAULT_OPTIONS,
	commands: new Map(),
	groups: new Map(),
	getArgumentSuggestions: () => [],
	getCommandSuggestions: () => [],
};

export const DataContext = createContext(DEFAULT_DATA);

export function DataProvider({ data, children }: DataProviderProps) {
	const store = useStore();

	useEffect(() => store.setHistory(data.history), [data.history]);

	data.onHistoryChanged.Connect((entry) =>
		store.addHistoryEntry(entry, data.options.historyLength ?? DEFAULT_HISTORY_LENGTH),
	);

	return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}
