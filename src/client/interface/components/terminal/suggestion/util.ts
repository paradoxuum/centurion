import { palette } from "../../../constants/palette";
import { toHex } from "../../../util/color";

const HIGHLIGHT_PREFIX = `<font color="${toHex(palette.blue)}">`;

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
