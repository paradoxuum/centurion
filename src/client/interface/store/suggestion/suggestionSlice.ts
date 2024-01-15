import { createProducer } from "@rbxts/reflex";
import { removeIndex, set } from "@rbxts/sift/out/Array";
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
	setSuggestion: (state, index: number, suggestion?: Suggestion) => ({
		...state,
		value:
			suggestion !== undefined
				? set(state.value, index + 1, suggestion)
				: removeIndex(state.value, index + 1),
	}),

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
