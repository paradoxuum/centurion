import { InferState, combineProducers } from "@rbxts/reflex";
import { appSlice } from "./app";
import { commandSlice } from "./command";
import { historySlice } from "./history";
import { suggestionSlice } from "./suggestion";
import { textSlice } from "./text";

export type RootStore = typeof store;
export type RootState = InferState<RootStore>;

export const store = combineProducers({
	app: appSlice,
	command: commandSlice,
	history: historySlice,
	suggestion: suggestionSlice,
	text: textSlice,
});
