import { useEventListener } from "@rbxts/pretty-react-hooks";
import Roact, { createContext, useState } from "@rbxts/roact";
import { CommandOptions, GroupOptions, Path } from "../../../shared";
import { DEFAULT_CLIENT_OPTIONS } from "../../options";
import { ClientOptions, HistoryEntry, InterfaceContext } from "../../types";

export interface CommanderContextData {
	options: ClientOptions;
	execute: (path: Path, text: string) => Promise<HistoryEntry>;
	commands: Map<string, CommandOptions>;
	groups: Map<string, GroupOptions>;
	history: HistoryEntry[];
	addHistoryEntry: (entry: HistoryEntry) => void;
}

const DEFAULT_EXECUTE_CALLBACK = async () => ({
	text: "Command executed.",
	success: true,
	sentAt: DateTime.now().UnixTimestamp,
});

export const DEFAULT_COMMANDER_CONTEXT: CommanderContextData = {
	options: DEFAULT_CLIENT_OPTIONS,
	execute: DEFAULT_EXECUTE_CALLBACK,
	commands: new Map(),
	groups: new Map(),
	history: [],
	addHistoryEntry: () => {},
};

export interface CommanderProviderProps extends Roact.PropsWithChildren {
	value: InterfaceContext;
}

export const CommanderContext = createContext<CommanderContextData>(
	DEFAULT_COMMANDER_CONTEXT,
);

export function CommanderProvider({ value, children }: CommanderProviderProps) {
	const [history, setHistory] = useState(value.initialData.history);
	const [commands, setCommands] = useState(value.initialData.commands);
	const [groups, setGroups] = useState(value.initialData.groups);

	useEventListener(value.events.historyUpdated, (entries) => {
		setHistory([...entries]);
	});

	useEventListener(value.events.commandAdded, (key, command) => {
		const newData = new Map([...commands]);
		newData.set(key, command);
		setCommands(newData);
	});

	useEventListener(value.events.groupAdded, (key, group) => {
		const newData = new Map([...groups]);
		groups.set(key, group);
		setGroups(newData);
	});

	return (
		<CommanderContext.Provider
			value={{
				addHistoryEntry: value.addHistoryEntry,
				execute: value.execute,
				options: value.options,
				history,
				commands,
				groups,
			}}
		>
			{children}
		</CommanderContext.Provider>
	);
}
