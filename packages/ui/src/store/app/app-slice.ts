import { createProducer } from "@rbxts/reflex";

export interface AppState {
	visible: boolean;
}

const initialAppState: AppState = {
	visible: false,
};

export const appSlice = createProducer(initialAppState, {
	setVisible: (state, visible: boolean) => ({ ...state, visible }),
});
