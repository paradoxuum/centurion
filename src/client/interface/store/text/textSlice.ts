import { createProducer } from "@rbxts/reflex";

export interface TextState {
	value: string;
	parts: string[];
	index: number;
	valid: boolean;
}

export const initialTextState: TextState = {
	value: "",
	parts: [],
	index: -1,
	valid: false,
};

export const textSlice = createProducer(initialTextState, {
	setText: (state, text: string, textParts: string[]) => {
		const endsWithSpace = textParts.size() > 0 && text.match("%s$").size() > 0;

		return {
			...state,
			value: text,
			parts: textParts,
			index: endsWithSpace ? textParts.size() : textParts.size() - 1,
		};
	},

	setTextValid: (state, valid: boolean) => ({
		...state,
		valid,
	}),
});
