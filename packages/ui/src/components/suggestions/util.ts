import { TextService } from "@rbxts/services";
import { InterfaceOptions, Suggestion } from "../../types";
import { SuggestionTextBounds } from "./types";

const TEXT_BOUNDS_PARAMS = new Instance("GetTextBoundsParams");
TEXT_BOUNDS_PARAMS.RichText = true;

const DEFAULT_BOUNDS = new Vector2();

let prevColor: Color3 | undefined;
let prevColorHex: string | undefined;

export function highlightMatching(
	color: Color3,
	text?: string,
	terminalText?: string,
) {
	if (text === undefined) return "";
	if (terminalText === undefined) return text;

	const subText = text.sub(0, terminalText.size());
	if (terminalText.lower() !== subText.lower()) {
		return text;
	}

	if (prevColor !== color) {
		prevColor = color;
		prevColorHex = color.ToHex();
	}

	const unhighlightedText = text.sub(terminalText.size() + 1);
	return `<font color="#${prevColorHex}">${subText}</font>${unhighlightedText}`;
}

export function getSuggestionTextBounds(
	options: InterfaceOptions,
	suggestion: Suggestion,
	titleTextSize: number,
	textSize: number,
	maxWidth: number,
	maxBadgeWidth: number,
): SuggestionTextBounds {
	// Get title text bounds
	TEXT_BOUNDS_PARAMS.Text = suggestion.title;
	TEXT_BOUNDS_PARAMS.Size = titleTextSize;
	TEXT_BOUNDS_PARAMS.Font = options.font.bold;
	const titleBounds = TextService.GetTextBoundsAsync(TEXT_BOUNDS_PARAMS);

	// Get description text bounds
	TEXT_BOUNDS_PARAMS.Width = maxWidth;
	TEXT_BOUNDS_PARAMS.Size = textSize;
	TEXT_BOUNDS_PARAMS.Font = options.font.regular;

	let descriptionBounds = DEFAULT_BOUNDS;
	if (suggestion.description !== undefined) {
		TEXT_BOUNDS_PARAMS.Text = suggestion.description;
		descriptionBounds = TextService.GetTextBoundsAsync(TEXT_BOUNDS_PARAMS);
	}

	let errorTextHeight = 0;
	let typeBadgeWidth = 0;
	if (suggestion.type === "argument") {
		// Get error text bounds
		if (suggestion.error !== undefined) {
			TEXT_BOUNDS_PARAMS.Text = suggestion.error ?? "";
			errorTextHeight = TextService.GetTextBoundsAsync(TEXT_BOUNDS_PARAMS).Y;
		}

		// Get type badge bounds
		TEXT_BOUNDS_PARAMS.Text = suggestion.dataType;
		TEXT_BOUNDS_PARAMS.Width = maxBadgeWidth;
		typeBadgeWidth = TextService.GetTextBoundsAsync(TEXT_BOUNDS_PARAMS).X;
	}

	return {
		title: UDim2.fromOffset(titleBounds.X, titleBounds.Y),
		description: UDim2.fromOffset(descriptionBounds.X, descriptionBounds.Y),
		errorTextHeight,
		typeBadgeWidth,
	};
}
