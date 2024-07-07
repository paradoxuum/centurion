import { RootState } from "..";

export const selectSuggestion = (state: RootState) => state.suggestion.current;
