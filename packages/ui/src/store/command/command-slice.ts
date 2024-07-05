import { ImmutableRegistryPath } from "@rbxts/centurion";
import { createProducer } from "@rbxts/reflex";

export interface CommandState {
	path?: ImmutableRegistryPath;
	argIndex?: number;
}

const initialCommandState: CommandState = {};

export const commandSlice = createProducer(initialCommandState, {
	setCommand: (state, path?: ImmutableRegistryPath) => ({
		...state,
		path,
	}),

	setArgIndex: (state, index?: number) => ({ ...state, argIndex: index }),
});
