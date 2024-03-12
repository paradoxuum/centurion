import { RootState } from "..";

export const selectCommand = (state: RootState) => state.command.path;
