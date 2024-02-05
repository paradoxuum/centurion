import { createProducer } from "@rbxts/reflex";
import { copy } from "@rbxts/sift/out/Array";

export interface HistoryState {
	commandHistory: string[];
	commandHistoryIndex: number;
}

export const initialHistoryState: HistoryState = {
	commandHistory: [],
	commandHistoryIndex: -1,
};

/**
 * Limits an array by removing the first n (limit) elements if
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

export const historySlice = createProducer(initialHistoryState, {
	addCommandHistory: (state, command: string, limit: number) => {
		if (
			state.commandHistory.size() > 0 &&
			state.commandHistory[state.commandHistory.size() - 1] === command
		) {
			return state;
		}

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
});
