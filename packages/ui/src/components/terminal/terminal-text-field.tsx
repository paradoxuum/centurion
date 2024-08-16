import { subscribe } from "@rbxts/charm";
import { UserInputService } from "@rbxts/services";
import Vide, { cleanup, Derivable, effect, source } from "@rbxts/vide";
import { useAtom } from "../../hooks/use-atom";
import { useClient } from "../../hooks/use-client";
import { useEvent } from "../../hooks/use-event";
import { px } from "../../hooks/use-px";
import {
	commandArgIndex,
	currentCommandPath,
	currentSuggestion,
	currentTextPart,
	interfaceOptions,
	interfaceVisible,
	terminalArgIndex,
	terminalText,
	terminalTextParts,
	terminalTextValid,
} from "../../store";
import { Frame } from "../ui/frame";
import { Padding } from "../ui/padding";
import { Text } from "../ui/text";
import { TextField } from "../ui/text-field";
import { formatPartsAsPath, getArgumentNames } from "./command";

interface TerminalTextFieldProps {
	anchor?: Derivable<Vector2>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	backgroundTransparency?: Derivable<number>;
	onTextChange?: (text: string) => void;
	onSubmit?: (text: string) => void;
}

const TEXT_SIZE = 22;

export function TerminalTextField({
	anchor,
	size,
	position,
	backgroundTransparency,
	onTextChange,
	onSubmit,
}: TerminalTextFieldProps) {
	const client = useClient();
	const options = useAtom(interfaceOptions);
	const visible = useAtom(interfaceVisible);
	const valid = useAtom(terminalTextValid);

	const ref = source<TextBox>();
	const commandHistory = source<string[]>([]);
	const commandHistoryIndex = source<number | undefined>(undefined);
	const suggestionText = source("");
	let currentTextValue = "";

	// Focus text field when terminal becomes visible
	effect(() => {
		if (visible()) {
			ref()?.CaptureFocus();
		} else {
			ref()?.ReleaseFocus();
		}
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
			textBox.Text = "";
			suggestionText("");
			commandHistoryIndex(undefined);
			return;
		}

		const newIndex = math.clamp(
			(historyIndex ?? history.size()) + (up ? -1 : 1),
			0,
			lastIndex,
		);

		const newText = history[newIndex];
		textBox.Text = newText;
		textBox.CursorPosition = newText.size() + 1;
		suggestionText("");
		commandHistoryIndex(newIndex);
	};

	const suggestionConnection = subscribe(currentSuggestion, (suggestion) => {
		if (suggestion === undefined) {
			suggestionText("");
			return;
		}

		const atNextPart = terminalText().sub(-1) === " ";
		const textParts = terminalTextParts();
		if (textParts.isEmpty()) {
			suggestionText(suggestion.title);
			return;
		}

		const currentText = ref()?.Text;
		if (currentText === undefined) return;

		// Command suggestions
		if (suggestion.type === "command") {
			const suggestionStartIndex =
				(!atNextPart ? textParts[textParts.size() - 1].size() : 0) + 1;
			suggestionText(currentText + suggestion.title.sub(suggestionStartIndex));
			return;
		}

		// Argument suggestions
		const command = currentCommandPath();
		const argIndex = terminalArgIndex();
		if (
			suggestion.type !== "argument" ||
			command === undefined ||
			argIndex === undefined
		) {
			return;
		}

		let newText = currentText;
		if (atNextPart && argIndex === commandArgIndex()) {
			newText += suggestion.title;
		} else if (!suggestion.others.isEmpty()) {
			newText += suggestion.others[0].sub((currentTextPart()?.size() ?? 0) + 1);
		}

		const argNames = getArgumentNames(client.registry, command);
		for (const i of $range(argIndex + 1, argNames.size() - 1)) {
			newText = `${newText} ${argNames[i]}`;
		}
		suggestionText(newText);
	});

	cleanup(suggestionConnection);

	useEvent(UserInputService.InputBegan, (input) => {
		const textBox = ref();
		if (textBox === undefined || !textBox?.IsFocused()) return;

		if (input.KeyCode === Enum.KeyCode.Up) {
			traverseHistory(true);
		} else if (input.KeyCode === Enum.KeyCode.Down) {
			traverseHistory(false);
		}

		if (input.KeyCode !== Enum.KeyCode.Tab) return;

		// Command suggestions
		const commandPath = currentCommandPath();
		const suggestion = currentSuggestion();
		if (suggestion === undefined) return;

		const currentText = textBox.Text;
		const atNextPart = currentText.sub(-1) === " ";

		if (commandPath === undefined) {
			const suggestionTitle = suggestion.title;
			const textParts = terminalTextParts();
			if (textParts.isEmpty()) return;

			const pathParts = [...textParts];

			let newText = currentText;
			if (atNextPart) {
				newText += suggestionTitle;
				pathParts.push(suggestionTitle);
			} else if (!textParts.isEmpty()) {
				const lastPartSize = textParts[textParts.size() - 1];
				newText =
					newText.sub(0, newText.size() - lastPartSize.size()) +
					suggestionTitle;
				pathParts.remove(textParts.size() - 1);
				pathParts.push(suggestionTitle);
			}

			const nextCommand = client.registry.getCommandByString(
				formatPartsAsPath(pathParts),
			)?.options;
			if (
				nextCommand === undefined ||
				!(nextCommand.arguments?.isEmpty() ?? true)
			) {
				newText += " ";
			}

			suggestionText("");
			textBox.Text = newText;
			textBox.CursorPosition = newText.size() + 1;
			return;
		}

		const commandArgs =
			client.registry.getCommand(commandPath)?.options.arguments;

		if (
			suggestion.type === "command" &&
			!atNextPart &&
			!(commandArgs?.isEmpty() ?? true)
		) {
			suggestionText("");

			const newText = `${currentText} `;
			textBox.Text = newText;
			textBox.CursorPosition = newText.size() + 1;
			return;
		}

		// Argument suggestions
		if (suggestion.others.isEmpty()) return;

		const argIndex = terminalArgIndex();
		if (argIndex === undefined || commandArgs === undefined) return;

		let newText = currentText;
		const otherSuggestion = suggestion.others[0];
		newText = newText.sub(0, newText.size() - (currentTextPart()?.size() ?? 0));
		newText += otherSuggestion.match("%s").isEmpty()
			? otherSuggestion
			: `"${otherSuggestion}"`;

		if (argIndex < commandArgs.size() - 1) {
			newText += " ";
		}

		suggestionText("");
		textBox.Text = newText;
		textBox.CursorPosition = newText.size() + 1;
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
					return valid() ? options().palette.success : options().palette.error;
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
						textBox.CaptureFocus();
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
