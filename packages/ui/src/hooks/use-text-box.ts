import { source } from "@rbxts/vide";

const ref = source<TextBox>();

export function updateText(text: string) {
	const textBox = ref();
	if (textBox === undefined) return;
	textBox.Text = text;
	textBox.CursorPosition = text.size() + 1;
}

export function useTextBox(textBox: TextBox) {
	ref(textBox);
}
