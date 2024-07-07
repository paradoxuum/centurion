import { RootState } from "..";

export const selectText = (state: RootState) => state.text;

export const selectValid = (state: RootState) => state.text.valid;
