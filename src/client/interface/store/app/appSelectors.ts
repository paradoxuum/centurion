import { RootState } from "..";

export const selectHistory = (state: RootState) => state.app.history;

export const selectTerminalText = (state: RootState) => state.app.terminalText;

export const selectSuggestionText = (state: RootState) => state.app.suggestionText;
