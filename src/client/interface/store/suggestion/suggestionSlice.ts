import { createProducer } from "@rbxts/reflex";
import { append, removeIndex, set } from "@rbxts/sift/out/Array";
import { Suggestion } from "../../types";

export interface SuggestionState {
	value: Suggestion[];
	currentIndex: number;
}

export const initialSuggestionState: SuggestionState = {
	value: [],
	currentIndex: -1,
};

export const suggestionSlice = createProducer(initialSuggestionState, {
	setSuggestion: (state, index: number, suggestion?: Suggestion) => {
		if (index < 0) return state;

		let suggestions: Suggestion[];
		if (index >= state.value.size()) {
			if (suggestion === undefined) return state;
			suggestions = append(state.value, suggestion);
		} else {
			suggestions =
				suggestion !== undefined
					? set(state.value, index + 1, suggestion)
					: removeIndex(state.value, index + 1);
		}

		return {
			...state,
			value: suggestions,
		};
	},

	setSuggestionIndex: (state, index: number) => ({
		...state,
		currentIndex: index,
	}),

	clearSuggestions: (state) => ({
		...state,
		value: [],
		currentIndex: -1,
	}),
});
