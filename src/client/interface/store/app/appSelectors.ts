import { RootState } from "..";

export const selectHistory = (state: RootState) => state.app.history;

export const selectText = (state: RootState) => state.app.text;

export const selectSuggestionText = (state: RootState) => state.app.suggestionText;

export const selectSuggestions = (state: RootState) => state.app.suggestions;
