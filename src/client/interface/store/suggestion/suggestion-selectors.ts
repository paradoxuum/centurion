import { RootState } from "..";

export const selectCurrentSuggestion = (state: RootState) => {
	const index = state.suggestion.currentIndex;
	if (index < 0 || index >= state.suggestion.value.size()) return undefined;
	return state.suggestion.value[index];
};
