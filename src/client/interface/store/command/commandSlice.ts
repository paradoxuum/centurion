import { createProducer } from "@rbxts/reflex";
import { ImmutableCommandPath } from "../../../../shared";

export interface CommandState {
	path?: ImmutableCommandPath;
	argIndex?: number;
}

export const initialCommandState: CommandState = {};

export const commandSlice = createProducer(initialCommandState, {
	setCommand: (state, path?: ImmutableCommandPath) => ({
		...state,
		path,
	}),

	setArgIndex: (state, index?: number) => ({ ...state, argIndex: index }),
});
