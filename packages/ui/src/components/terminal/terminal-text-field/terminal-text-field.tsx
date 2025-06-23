import { UserInputService } from "@rbxts/services";
import Vide, { Derivable, effect, read, source } from "@rbxts/vide";
import { useClient } from "../../../hooks/use-client";
import { useEvent } from "../../../hooks/use-event";
import { px } from "../../../hooks/use-px";
import { updateText, useTextBox } from "../../../hooks/use-text-box";
import {
	currentCommandPath,
	currentSuggestion,
	options,
	terminalTextValid,
	visible,
} from "../../../store";
import { Frame } from "../../ui/frame";
import { Padding } from "../../ui/padding";
import { Text } from "../../ui/text";
import { TextField } from "../../ui/text-field";
import {
	completeArgument,
	completeCommand,
	getSuggestedText,
} from "./suggestion";

interface TerminalTextFieldProps {
	anchor?: Derivable<Vector2>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	backgroundTransparency?: Derivable<number>;
	onTextChange?: (text: string) => void;
	onSubmit?: (text: string) => void;
	textParts: Derivable<string[]>;
	atNextPart: () => boolean;
}

const TEXT_SIZE = 22;

export function TerminalTextField({
	anchor,
	size,
	position,
	backgroundTransparency,
	onTextChange,
	onSubmit,
	textParts,
	atNextPart,
}: TerminalTextFieldProps) {
	const client = useClient();

	const ref = source<TextBox>();

	const commandHistory = source<string[]>([]);
	const commandHistoryIndex = source<number | undefined>(undefined);
	const suggestionText = source("");
	let currentTextValue = "";
	let onScreenKeyboard = false;

	// Focus text field when terminal becomes visible
	effect(() => {
		if (visible()) {
			ref()?.CaptureFocus();
		} else {
			ref()?.ReleaseFocus();
		}
	});

	effect(() => {
		const textBox = ref();
		if (textBox === undefined) return;
		useTextBox(textBox);
	});

	const traverseHistory = (up: boolean) => {
		const history = commandHistory();
		if (history.isEmpty()) return;

		const historyIndex = commandHistoryIndex();
		if (!up && historyIndex === undefined) return;

		const textBox = ref();
		if (textBox === undefined) return;

		const lastIndex = history.size() - 1;
		if (!up && historyIndex === lastIndex) {
			updateText("");
			commandHistoryIndex(undefined);
			return;
		}

		const newIndex = math.clamp(
			(historyIndex ?? history.size()) + (up ? -1 : 1),
			0,
			lastIndex,
		);

		updateText(history[newIndex]);
		commandHistoryIndex(newIndex);
	};

	effect(() => {
		suggestionText(
			getSuggestedText(
				client.registry,
				ref()?.Text ?? "",
				read(textParts),
				atNextPart(),
				currentSuggestion(),
			),
		);
	});

	useEvent(UserInputService.InputBegan, (input) => {
		const textBox = ref();
		if (textBox === undefined || !textBox?.IsFocused()) return;

		// Handle history traversal
		if (input.KeyCode === Enum.KeyCode.Up) {
			traverseHistory(true);
		} else if (input.KeyCode === Enum.KeyCode.Down) {
			traverseHistory(false);
		}

		if (input.KeyCode !== Enum.KeyCode.Tab) return;

		// Handle autocompletion
		const commandPath = currentCommandPath();
		const suggestion = currentSuggestion();
		if (suggestion === undefined) return;

		const currentText = textBox.Text;

		if (commandPath === undefined) {
			updateText(
				completeCommand(
					client.registry,
					textBox.Text,
					read(textParts),
					suggestion.title,
				),
			);
			return;
		}

		const argCount =
			client.registry.getCommand(commandPath)?.options.arguments?.size() ?? 0;
		if (suggestion.type === "command" && argCount !== 0) {
			updateText(`${currentText} `);
			return;
		}

		if (suggestion.others.isEmpty()) {
			updateText(currentText);
			return;
		}

		updateText(completeArgument(currentText, suggestion.others[0], argCount));
	});

	return (
		<Frame
			anchor={anchor}
			size={size}
			position={position}
			backgroundColor={() => options().palette.surface}
			backgroundTransparency={backgroundTransparency}
			cornerRadius={() => new UDim(0, px(4))}
		>
			<Padding all={() => new UDim(0, px(8))} />

			<TextField
				action={ref}
				size={UDim2.fromScale(1, 1)}
				textSize={() => px(TEXT_SIZE)}
				textColor={() => {
					return terminalTextValid()
						? options().palette.success
						: options().palette.error;
				}}
				textXAlignment="Left"
				placeholderText="Enter command..."
				placeholderColor={() => options().palette.subtext}
				font={() => options().font.medium}
				clearTextOnFocus={false}
				native={{
					FocusLost: (enterPressed) => {
						if (!enterPressed) return;

						const textBox = ref();
						if (textBox === undefined) return;

						const currentText = textBox.Text;
						const history = commandHistory();
						if (
							currentText !== "" &&
							(history.isEmpty() || history[history.size() - 1] !== currentText)
						) {
							commandHistory([...history, textBox.Text]);
						}
						commandHistoryIndex(undefined);
						onSubmit?.(currentText);
						textBox.Text = "";

						if (!onScreenKeyboard) {
							textBox.CaptureFocus();
						}
						onScreenKeyboard = false;
					},
					TextChanged: (currentText) => {
						const textBox = ref();
						if (textBox === undefined) return;

						const historyIndex = commandHistoryIndex();
						if (
							historyIndex !== undefined &&
							currentText !== commandHistory()[historyIndex]
						) {
							commandHistoryIndex(undefined);
						}

						// Remove line breaks
						let value = currentText;
						if (value.match("[\n\r]")[0] !== undefined) {
							value = value.gsub("[\n\r]", "")[0];
						}

						// Remove all tabs from text input - we use these for autocompletion
						if (value.match("\t")[0] !== undefined) {
							value = value.gsub("\t", "")[0];
						}

						textBox.Text = value;

						if (currentTextValue === value) return;
						currentTextValue = value;
						onTextChange?.(value);
					},
					ReturnPressedFromOnScreenKeyboard: () => {
						const textBox = ref();
						if (textBox === undefined) return;

						task.wait();
						onScreenKeyboard = true;
						textBox.ReleaseFocus(true);
					},
				}}
				zIndex={2}
			/>

			<Text
				size={UDim2.fromScale(1, 1)}
				text={suggestionText}
				textColor={() => options().palette.subtext}
				textSize={() => px(TEXT_SIZE)}
				textXAlignment="Left"
				font={() => options().font.medium}
			/>
		</Frame>
	);
}
