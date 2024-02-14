import { createProducer } from "@rbxts/reflex";
import { ImmutablePath } from "../../../../shared";

export interface CommandState {
	path?: ImmutablePath;
	argIndex?: number;
}

export const initialCommandState: CommandState = {};

export const commandSlice = createProducer(initialCommandState, {
	setCommand: (state, path?: ImmutablePath) => ({
		...state,
		path,
	}),

	setArgIndex: (state, index?: number) => ({ ...state, argIndex: index }),
});
