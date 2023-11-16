import { createProducer } from "@rbxts/reflex";
import { copyDeep, push, removeIndices } from "@rbxts/sift/out/Array";
import { CmdxClient } from "../../..";
import { CommandPath, ImmutableCommandPath } from "../../../../shared";
import { splitStringBySpace } from "../../../../shared/util/string";
import { DEFAULT_HISTORY_LENGTH } from "../../../options";
import { HistoryEntry } from "../../../types";

export interface AppState {
	history: HistoryEntry[];
	suggestionText: string;
	command?: ImmutableCommandPath;
	terminalText: {
		value: string;
		parts: string[];
		index: number;
	};
}

export const initialAppState: AppState = {
	history: [],
	suggestionText: "",
	command: ImmutableCommandPath.empty(),
	terminalText: {
		value: "",
		parts: [],
		index: -1,
	},
};

export const appSlice = createProducer(initialAppState, {
	addHistoryEntry: (state, entry: HistoryEntry) => {
		const history = copyDeep(state.history);
		const historyLimit = CmdxClient.options().historyLength ?? DEFAULT_HISTORY_LENGTH;
		if (history.size() >= historyLimit) {
			const indices: number[] = [];
			for (const i of $range(historyLimit, history.size())) {
				indices.push(i);
			}
			removeIndices(history, ...indices);
		}

		return {
			...state,
			history: push(state.history, entry),
		};
	},

	setHistory: (state, history: HistoryEntry[]) => ({
		...state,
		history,
	}),

	setText: (state, text: string) => {
		const parts = splitStringBySpace(text);
		const endsWithSpace = parts.size() > 0 && text.match("%s$").size() > 0;

		return {
			...state,
			terminalText: {
				value: text,
				parts,
				index: endsWithSpace ? parts.size() : parts.size() - 1,
			},
		};
	},

	setCommand: (state, path: CommandPath) => ({ ...state, path }),

	setSuggestionText: (state, text) => ({ ...state, suggestionText: text }),
});
