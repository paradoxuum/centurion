import { TextService } from "@rbxts/services";
import { Derivable, cleanup, derive, read } from "@rbxts/vide";

interface TextBoundsProps {
	text: Derivable<string | undefined>;
	font?: Derivable<Font>;
	size?: Derivable<number>;
	width?: Derivable<number>;
}

export function useTextBounds({ text, font, size, width }: TextBoundsProps) {
	const params = new Instance("GetTextBoundsParams");
	params.RichText = true;

	cleanup(params);

	return derive(() => {
		const textValue = read(text);
		if (textValue === undefined) {
			return Vector2.zero;
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
		return TextService.GetTextBoundsAsync(params);
	});
}
