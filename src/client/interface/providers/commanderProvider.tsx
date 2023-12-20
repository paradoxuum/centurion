import Roact, { createContext, useEffect, useState } from "@rbxts/roact";
import { copyDeep, merge, set } from "@rbxts/sift/out/Dictionary";
import { CommandOptions, CommandPath, GroupOptions } from "../../../shared";
import { DEFAULT_OPTIONS } from "../../options";
import { AppContext, ClientOptions, HistoryEntry } from "../../types";

export interface CommanderContextData {
	options: ClientOptions;
	execute: (path: CommandPath, text: string) => Promise<HistoryEntry>;
	commands: Map<string, CommandOptions>;
	groups: Map<string, GroupOptions>;
	history: HistoryEntry[];
	addHistoryEntry: (entry: HistoryEntry) => void;
}

export interface CommanderProviderProps extends Roact.PropsWithChildren {
	value: AppContext;
}

export const DEFAULT_COMMANDER_CONTEXT: CommanderContextData = {
	options: DEFAULT_OPTIONS,
	execute: async () => ({
		text: "Command executed.",
		success: true,
		sentAt: DateTime.now().UnixTimestamp,
	}),
	commands: new Map(),
	groups: new Map(),
	history: [],
	addHistoryEntry: () => {},
};

export const CommanderContext = createContext<CommanderContextData>(
	DEFAULT_COMMANDER_CONTEXT,
);

export function CommanderProvider({ value, children }: CommanderProviderProps) {
	const [data, setData] = useState<CommanderContextData>(
		DEFAULT_COMMANDER_CONTEXT,
	);

	useEffect(() => {
		setData(
			merge(data, {
				options: value.options,
				execute: value.execute,
				history: value.initialData.history,
				commands: value.initialData.commands,
				groups: value.initialData.groups,
				addHistoryEntry: value.addHistoryEntry,
			}),
		);

		const historyConnection = value.events.historyUpdated.Connect((entries) => {
			setData(set(data, "groups", copyDeep(entries)));
		});

		const commandConnection = value.events.commandAdded.Connect(
			(key, command) => {
				const newData = copyDeep(data);
				data.commands.set(key, command);
				setData(newData);
			},
		);

		const groupConnection = value.events.groupAdded.Connect((key, group) => {
			const newData = copyDeep(data);
			data.commands.set(key, group);
			setData(newData);
		});

		return () => {
			historyConnection.Disconnect();
			commandConnection.Disconnect();
			groupConnection.Disconnect();
		};
	}, []);

	return (
		<CommanderContext.Provider value={data}>
			{children}
		</CommanderContext.Provider>
	);
}
