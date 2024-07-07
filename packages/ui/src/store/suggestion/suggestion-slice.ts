import { createProducer } from "@rbxts/reflex";
import { Suggestion } from "../../types";

export interface SuggestionState {
	current?: Suggestion;
}

const initialSuggestionState: SuggestionState = {};

export const suggestionSlice = createProducer(initialSuggestionState, {
	setSuggestion: (state, suggestion?: Suggestion) => ({
		...state,
		current: suggestion,
	}),
});
