import { RootState } from "..";

export const selectHistory = (state: RootState) => state.app.history;

export const selectTerminalText = (state: RootState) => state.app.terminalText;
