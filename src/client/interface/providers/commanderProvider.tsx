import Roact, { createContext, useEffect, useState } from "@rbxts/roact";
import { copyDeep } from "@rbxts/sift/out/Dictionary";
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

type StaticContextData = Omit<
	CommanderContextData,
	"commands" | "groups" | "history"
>;

const DEFAULT_EXECUTE_CALLBACK = async () => ({
	text: "Command executed.",
	success: true,
	sentAt: DateTime.now().UnixTimestamp,
});

export const DEFAULT_COMMANDER_CONTEXT: CommanderContextData = {
	options: DEFAULT_OPTIONS,
	execute: DEFAULT_EXECUTE_CALLBACK,
	commands: new Map(),
	groups: new Map(),
	history: [],
	addHistoryEntry: () => {},
};

export interface CommanderProviderProps extends Roact.PropsWithChildren {
	value: AppContext;
}

export const CommanderContext = createContext<CommanderContextData>(
	DEFAULT_COMMANDER_CONTEXT,
);

export function CommanderProvider({ value, children }: CommanderProviderProps) {
	const [staticData, setStaticData] = useState<StaticContextData>({
		addHistoryEntry: () => {},
		execute: DEFAULT_EXECUTE_CALLBACK,
		options: DEFAULT_OPTIONS,
	});

	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [commands, setCommands] = useState<Map<string, CommandOptions>>(
		new Map(),
	);
	const [groups, setGroups] = useState<Map<string, GroupOptions>>(new Map());

	useEffect(() => {
		setStaticData({
			addHistoryEntry: value.addHistoryEntry,
			execute: value.execute,
			options: value.options,
		});

		setHistory(value.initialData.history);
		setCommands(value.initialData.commands);
		setGroups(value.initialData.groups);

		const historyConnection = value.events.historyUpdated.Connect((entries) => {
			setHistory(copyDeep(entries));
		});

		const commandConnection = value.events.commandAdded.Connect(
			(key, command) => {
				const newData = copyDeep(commands);
				newData.set(key, command);
				setCommands(commands);
			},
		);

		const groupConnection = value.events.groupAdded.Connect((key, group) => {
			const newData = copyDeep(groups);
			groups.set(key, group);
			setGroups(newData);
		});

		return () => {
			historyConnection.Disconnect();
			commandConnection.Disconnect();
			groupConnection.Disconnect();
		};
	}, []);

	return (
		<CommanderContext.Provider
			value={{
				addHistoryEntry: staticData.addHistoryEntry,
				execute: staticData.execute,
				options: staticData.options,
				history,
				commands,
				groups,
			}}
		>
			{children}
		</CommanderContext.Provider>
	);
}
