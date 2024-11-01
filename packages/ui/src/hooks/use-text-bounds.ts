import { TextService } from "@rbxts/services";
import { Derivable, cleanup, effect, read, source } from "@rbxts/vide";

interface TextBoundsProps {
	text: Derivable<string | undefined>;
	font?: Derivable<Font>;
	size?: Derivable<number>;
	width?: Derivable<number>;
}

const getBounds = Promise.promisify((params: GetTextBoundsParams) =>
	TextService.GetTextBoundsAsync(params),
);

export function useTextBounds({ text, font, size, width }: TextBoundsProps) {
	const bounds = source(Vector2.zero);

	const params = new Instance("GetTextBoundsParams");
	params.RichText = true;
	cleanup(params);

	effect(() => {
		const textValue = read(text);
		if (textValue === undefined) {
			bounds(Vector2.zero);
			return;
		}

		params.Text = textValue;

		const fontValue = read(font);
		const sizeValue = read(size);
		const widthValue = read(width);
		if (fontValue !== undefined) {
			params.Font = fontValue;
		}

		if (sizeValue !== undefined) {
			params.Size = sizeValue;
		}

		if (widthValue !== undefined) {
			params.Width = widthValue;
		}

		getBounds(params)
			.then((value) => bounds(value))
			.catch(() => bounds(Vector2.zero));
	});

	return bounds as () => Vector2;
}
