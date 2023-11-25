import { RootState } from "..";

export const selectHistory = (state: RootState) => state.app.history;

export const selectText = (state: RootState) => state.app.text;
