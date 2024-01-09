import { RootState } from "..";

export const selectVisible = (state: RootState) => state.app.visible;

export const selectText = (state: RootState) => state.app.text;

export const selectErrorText = (state: RootState) => state.app.errorText;

export const selectCommand = (state: RootState) => state.app.command;
