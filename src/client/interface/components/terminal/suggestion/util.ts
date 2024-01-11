import { TextService } from "@rbxts/services";
import { DEFAULT_FONT, fonts } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { ArgumentSuggestion, CommandSuggestion } from "../../../types";
import { toHex } from "../../../util/color";
import { SuggestionTextBounds } from "./types";

const HIGHLIGHT_PREFIX = `<font color="${toHex(palette.blue)}">`;
const TEXT_BOUNDS_PARAMS = new Instance("GetTextBoundsParams");
const DEFAULT_BOUNDS = new Vector2();

export function highlightMatching(text?: string, terminalText?: string) {
	if (text === undefined) return "";
	if (terminalText === undefined) return text;

	const subText = text.sub(0, terminalText.size());
	if (terminalText.lower() !== subText.lower()) {
		return text;
	}

	const unhighlightedText = text.sub(terminalText.size() + 1);
	return `${HIGHLIGHT_PREFIX}${subText}</font>${unhighlightedText}`;
}

export function getSuggestionTextBounds(
	suggestion: ArgumentSuggestion | CommandSuggestion,
	titleTextSize: number,
	textSize: number,
	maxWidth: number,
	maxBadgeWidth: number,
): SuggestionTextBounds {
	// Get title text bounds
	TEXT_BOUNDS_PARAMS.Text = suggestion.title;
	TEXT_BOUNDS_PARAMS.Size = titleTextSize;
	TEXT_BOUNDS_PARAMS.Font = fonts.inter.bold;
	TEXT_BOUNDS_PARAMS.Width = maxWidth;
	const titleBounds = TextService.GetTextBoundsAsync(TEXT_BOUNDS_PARAMS);

	// Get description text bounds
	TEXT_BOUNDS_PARAMS.Size = textSize;
	TEXT_BOUNDS_PARAMS.Font = DEFAULT_FONT;

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
