import { createProducer } from "@rbxts/reflex";
import { copyDeep, push, removeIndices } from "@rbxts/sift/out/Array";
import { ImmutableCommandPath } from "../../../../shared";
import { HistoryEntry } from "../../../types";

export interface AppState {
	history: HistoryEntry[];
	command?: ImmutableCommandPath;
	argIndex?: number;
	text: {
		value: string;
		parts: string[];
		index: number;
	};
}

export const initialAppState: AppState = {
	history: [],
	text: {
		value: "",
		parts: [],
		index: -1,
	},
};

export const appSlice = createProducer(initialAppState, {
	addHistoryEntry: (state, entry: HistoryEntry, limit: number) => {
		const history = copyDeep(state.history);
		if (history.size() >= limit) {
			const indices: number[] = [];
			for (const i of $range(limit, history.size())) {
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

	setCommand: (state, path?: ImmutableCommandPath) => ({ ...state, command: path }),

	setArgIndex: (state, index?: number) => ({ ...state, argIndex: index }),

	setText: (state, text: string, textParts: string[]) => {
		const endsWithSpace = textParts.size() > 0 && text.match("%s$").size() > 0;

		return {
			...state,
			text: {
				value: text,
				parts: textParts,
				index: endsWithSpace ? textParts.size() : textParts.size() - 1,
			},
		};
	},
});
