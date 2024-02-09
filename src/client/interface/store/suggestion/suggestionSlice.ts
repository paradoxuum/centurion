import { createProducer } from "@rbxts/reflex";
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
			suggestions = [...state.value, suggestion];
		} else {
			suggestions = [...state.value];
			if (suggestion !== undefined) {
				suggestions[index] = suggestion;
			} else {
				suggestions.remove(index);
			}
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
