import { InferState, combineProducers } from "@rbxts/reflex";
import { appSlice } from "./app";

export type RootStore = typeof store;
export type RootState = InferState<RootStore>;

export const store = combineProducers({
	app: appSlice,
});
