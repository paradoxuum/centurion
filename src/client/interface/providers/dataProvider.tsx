import Roact, { createContext } from "@rbxts/roact";
import { DEFAULT_OPTIONS } from "../../options";
import { AppData } from "../../types";

export interface DataProviderProps extends Roact.PropsWithChildren {
	data: AppData;
}

export const DEFAULT_DATA: AppData = {
	options: DEFAULT_OPTIONS,
	execute: async () => {
		return {
			text: "Command executed.",
			success: true,
			sentAt: DateTime.now().UnixTimestamp,
		};
	},

	commands: new Map(),
	groups: new Map(),
	history: [],
	onHistoryUpdated: new Instance("BindableEvent").Event,
};

export const DataContext = createContext(DEFAULT_DATA);

export function DataProvider({ data, children }: DataProviderProps) {
	return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}
