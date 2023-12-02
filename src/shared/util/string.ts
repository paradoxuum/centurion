function charCode(n: string) {
	return utf8.char(tonumber(n, 16) as number);
}

function parseEscapeSequences(text: string): string {
	return text
		.gsub("\\(.)", {
			t: "\t",
			n: "\n",
		})[0]
		.gsub("\\u(%x%x%x%x)", charCode)[0]
		.gsub("\\x(%x%x)", charCode)[0];
}

function encodeControlChars(text: string) {
	return text
		.gsub("\\\\", "___!CMDR_ESCAPE!___")[0]
		.gsub('\\"', "___!CMDR_QUOTE!___")[0]
		.gsub("\\'", "___!CMDR_SQUOTE!___")[0]
		.gsub("\\\n", "___!CMDR_NL!___")[0];
}

function decodeControlChars(text: string) {
	return text
		.gsub("___!CMDR_ESCAPE!___", "\\")[0]
		.gsub("___!CMDR_QUOTE!___", '"')[0]
		.gsub("___!CMDR_NL!___", "\n")[0];
}

const START_QUOTE_PATTERN = `^(['"])`;
const END_QUOTE_PATTERN = `(['"])$`;
// eslint-disable-next-line no-useless-escape
const ESCAPE_PATTERN = `(\*)['"]$`;

/**
 * Splits a string by space and takes into account quoted sentences,
 * which will be treated as a single part instead of being split.
 *
 * @see https://github.com/evaera/Cmdr/blob/e3180638849a8615bb982bb74f970bf64435da63/Cmdr/Shared/Util.lua
 * @param text The text to split
 * @param max The max number of splits
 * @returns The split string
 */
export function splitStringBySpace(
	text: string,
	max: number = math.huge,
): string[] {
	const resultText = encodeControlChars(text);
	const t: string[] = [];

	let buf: string | undefined;
	let quoted: string | undefined;
	for (let [str] of resultText.gmatch("[^ ]+")) {
		str = parseEscapeSequences(str as string);

		const startQuote = str.match(START_QUOTE_PATTERN)[0] as string;
		const endQuote = str.match(END_QUOTE_PATTERN)[0] as string;
		const escaped = str.match(ESCAPE_PATTERN)[0] as string;

		if (
			startQuote !== undefined &&
			quoted === undefined &&
			endQuote === undefined
		) {
			[buf, quoted] = [str, startQuote];
		} else if (
			buf !== undefined &&
			endQuote === quoted &&
			escaped.size() % 2 === 0
		) {
			[str, buf, quoted] = [`${buf} ${str}`, undefined, undefined];
		} else if (buf !== undefined) {
			buf = `${buf} ${str}`;
		}

		if (buf !== undefined) {
			continue;
		}

		const result = decodeControlChars(
			str.gsub(START_QUOTE_PATTERN, "")[0].gsub(END_QUOTE_PATTERN, "")[0],
		);
		if (t.size() > max) {
			t[t.size() - 1] = result;
		} else {
			t.push(result);
		}
	}

	if (buf !== undefined) {
		if (t.size() > max) {
			t[t.size() - 1] = decodeControlChars(buf);
		} else {
			t.push(decodeControlChars(buf));
		}
	}

	return t;
}

export function endsWithSpace(text: string) {
	return text.size() > 0 && text.match("%s$").size() > 0;
}

export function formatPartsAsPath(textParts: string[]) {
	return textParts.join("/");
}
