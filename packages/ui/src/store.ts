import { ImmutableRegistryPath } from "@rbxts/centurion";
import { splitString } from "@rbxts/centurion/out/shared/util/string";
import { atom, computed } from "@rbxts/charm";
import { DEFAULT_INTERFACE_OPTIONS } from "./constants/options";
import { InterfaceOptions, Suggestion } from "./types";

export const interfaceVisible = atom(false);
export const interfaceOptions = atom<InterfaceOptions>(
	DEFAULT_INTERFACE_OPTIONS,
);
export const mouseOverInterface = atom(false);

export const currentCommandPath = atom<ImmutableRegistryPath | undefined>(
	undefined,
);
export const currentArgIndex = atom<number | undefined>(undefined);

export const currentSuggestion = atom<Suggestion | undefined>(undefined);
export const terminalText = atom("");
export const terminalTextParts = computed(() => {
	return splitString(terminalText(), " ");
});
export const currentTextPart = computed(() => {
	const text = terminalText();
	const textParts = terminalTextParts();

	const endsWithSpace = textParts.size() > 0 && text.match("%s$").size() > 0;
	const index = endsWithSpace ? textParts.size() : textParts.size() - 1;
	if (index === -1 || index >= textParts.size()) return;
	return textParts[index];
});
export const terminalTextValid = atom(false);
