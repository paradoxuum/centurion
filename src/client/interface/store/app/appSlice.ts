import { createProducer } from "@rbxts/reflex";
import { copy } from "@rbxts/sift/out/Array";
import { ImmutableCommandPath } from "../../../../shared";
import { HistoryEntry } from "../../../types";

export interface AppState {
	visible: boolean;

	commandHistory: string[];
	commandHistoryIndex: number;

	command?: ImmutableCommandPath;
	argIndex?: number;
	text: {
		value: string;
		parts: string[];
		index: number;
	};
}

export const initialAppState: AppState = {
	visible: false,
	commandHistory: [],
	commandHistoryIndex: -1,
	text: {
		value: "",
		parts: [],
		index: -1,
	},
};

/**
 * Limits an array by removing the first n (limit) elments if
 * the array's size exceeds the limit.
 *
 * @param array The array to limit
 * @param limit The limit
 */
function limitArray<T extends defined>(array: T[], limit: number) {
	if (array.size() <= limit) return;
	for (const i of $range(0, math.min(array.size() - 1, limit - 1))) {
		array.remove(i);
	}
}

export const appSlice = createProducer(initialAppState, {
	setVisible: (state, visible: boolean) => ({ ...state, visible }),

	addCommandHistory: (state, command: string, limit: number) => {
		const commandHistory = copy(state.commandHistory);
		limitArray(commandHistory, limit);
		commandHistory.push(command);

		return {
			...state,
			commandHistory,
		};
	},

	setCommandHistoryIndex: (state, index: number) => ({
		...state,
		commandHistoryIndex: index,
	}),

	setHistory: (state, history: HistoryEntry[]) => ({
		...state,
		history,
	}),

	setCommand: (state, path?: ImmutableCommandPath) => ({
		...state,
		command: path,
	}),

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
