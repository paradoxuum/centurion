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

	const unhighlightedText = text.sub(terminalText.size() + 1);
	return `<font color="#${color.ToHex()}">${subText}</font>${unhighlightedText}`;
}
