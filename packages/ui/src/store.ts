import { ImmutableRegistryPath } from "@rbxts/centurion";
import { source } from "@rbxts/vide";
import { DEFAULT_INTERFACE_OPTIONS } from "./constants/options";
import { Suggestion } from "./types";

export const visible = source(false);
export const options = source(DEFAULT_INTERFACE_OPTIONS);
export const mouseOverInterface = source(false);

export const currentCommandPath = source<ImmutableRegistryPath | undefined>(
	undefined,
);
export const commandArgIndex = source<number | undefined>(undefined);
export const terminalArgIndex = source<number | undefined>(undefined);

export const currentSuggestion = source<Suggestion | undefined>(undefined);
export const terminalText = source("");
export const terminalTextValid = source(false);
export const currentTextPart = source<string | undefined>(undefined);
