import { ImmutableRegistryPath } from "@rbxts/centurion";
import { splitString } from "@rbxts/centurion/out/shared/util/string";
import { atom, computed } from "@rbxts/charm";
import { DEFAULT_INTERFACE_OPTIONS } from "./constants/options";
import { Suggestion } from "./types";

export const interfaceVisible = atom(false);
export const interfaceOptions = atom(DEFAULT_INTERFACE_OPTIONS);
export const mouseOverInterface = atom(false);

export const currentCommandPath = atom<ImmutableRegistryPath | undefined>(
	undefined,
);
export const commandArgIndex = atom<number | undefined>(undefined);
export const terminalArgIndex = atom<number | undefined>(undefined);

export const currentSuggestion = atom<Suggestion | undefined>(undefined);
export const terminalText = atom("");
export const terminalTextParts = computed(() => {
	return splitString(terminalText(), " ", true);
});
export const terminalTextValid = atom(false);
export const currentTextPart = atom<string | undefined>(undefined);
