const START_QUOTE_PATTERN = `^(['"])`;
const END_QUOTE_PATTERN = `(['"])%s*$`;

export function containsSpace(text: string) {
	return !text.match("%s").isEmpty();
}

export function stripQuotes(text: string) {
	return text.gsub(START_QUOTE_PATTERN, "")[0].gsub(END_QUOTE_PATTERN, "")[0];
}

export function getQuoteChar(text: string) {
	return text.match(START_QUOTE_PATTERN)[0] as string;
}

export function isQuoteStarted(text: string) {
	return text.match(START_QUOTE_PATTERN)[0] !== undefined;
}

export function isQuoteEnded(text: string) {
	return text.match(END_QUOTE_PATTERN)[0] !== undefined;
}
