import {
	endsWithSpace,
	formatPartsAsPath,
} from "@rbxts/centurion/out/shared/util/string";
import { subscribe } from "@rbxts/charm";
import { UserInputService } from "@rbxts/services";
import Vide, { cleanup, Derivable, effect, source } from "@rbxts/vide";
import { getAPI } from "../../hooks/use-api";
import { useAtom } from "../../hooks/use-atom";
import { useEvent } from "../../hooks/use-event";
import { px } from "../../hooks/use-px";
import {
	currentArgIndex,
	currentCommandPath,
	currentSuggestion,
	interfaceOptions,
	interfaceVisible,
	terminalText,
	terminalTextParts,
	terminalTextValid,
} from "../../store";
import { Frame } from "../ui/frame";
import { Padding } from "../ui/padding";
import { Text } from "../ui/text";
import { TextField } from "../ui/text-field";
import { getArgumentNames } from "./command";

interface TerminalTextFieldProps {
	anchorPoint?: Derivable<Vector2>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	backgroundTransparency?: Derivable<number>;
	onTextChange?: (text: string) => void;
	onSubmit?: (text: string) => void;
}

const TEXT_SIZE = 22;

export function TerminalTextField({
	anchorPoint,
	size,
	position,
	backgroundTransparency,
	onTextChange,
	onSubmit,
}: TerminalTextFieldProps) {
	const api = getAPI();
	const options = useAtom(interfaceOptions);
	const visible = useAtom(interfaceVisible);
	const valid = useAtom(terminalTextValid);

	const ref = source<TextBox | undefined>(undefined);
	const commandHistory = source<string[]>([]);
	const commandHistoryIndex = source<number | undefined>(undefined);
	const text = source("");
	const suggestionText = source("");

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

		const lastIndex = history.size() - 1;
		if (!up && historyIndex === lastIndex) {
			text("");
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
		text(newText);
		suggestionText("");
		commandHistoryIndex(newIndex);

		const textBox = ref();
		if (textBox !== undefined) {
			textBox.CursorPosition = newText.size() + 1;
		}
	};

	const suggestionConnection = subscribe(currentSuggestion, (suggestion) => {
		if (suggestion === undefined) {
			suggestionText("");
			return;
		}

		const atNextPart = endsWithSpace(terminalText());
		const textParts = terminalTextParts();
		const suggestionStartIndex =
			textParts.size() > 0
				? (!atNextPart ? textParts[textParts.size() - 1].size() : 0) + 1
				: -1;

		if (suggestion.type === "command" && suggestionStartIndex > -1) {
			suggestionText(text() + suggestion.title.sub(suggestionStartIndex));
			return;
		}

		const command = currentCommandPath();
		const argIndex = currentArgIndex();
		if (
			suggestion.type !== "argument" ||
			command === undefined ||
			argIndex === undefined
		) {
			return;
		}

		let newText = text();
		const argNames = getArgumentNames(api.registry, command);
		for (const i of $range(argIndex, argNames.size() - 1)) {
			if (i === argIndex && !atNextPart) {
				if (!suggestion.others.isEmpty()) {
					newText += suggestion.others[0].sub(suggestionStartIndex);
				}

				newText += " ";
				continue;
			}

			newText = `${newText}${argNames[i]} `;
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

		// Handle command suggestions
		const commandPath = currentCommandPath();
		const suggestion = currentSuggestion();
		if (commandPath === undefined) {
			const suggestionTitle = suggestion?.title;
			if (suggestionTitle === undefined) return;

			const currentText = text();
			const textParts = terminalTextParts();

			let newText = "";
			if (endsWithSpace(currentText)) {
				newText = currentText + suggestionTitle;
			} else if (!textParts.isEmpty()) {
				const textPartSize = textParts[textParts.size() - 1].size();
				newText =
					currentText.sub(0, currentText.size() - textPartSize) +
					suggestionTitle;
			}

			const suggestionTextParts = suggestionText()
				.gsub("%s+", " ")[0]
				.split(" ");
			const nextCommand = api.registry.getCommandByString(
				formatPartsAsPath(suggestionTextParts),
			)?.options;
			if (
				nextCommand === undefined ||
				(nextCommand.arguments?.size() ?? 0) > 0
			) {
				newText += " ";
			}

			suggestionText("");
			text(newText);
			textBox.CursorPosition = newText.size() + 1;
			return;
		}

		// Handle argument suggestions
		if (
			commandPath === undefined ||
			suggestion === undefined ||
			suggestion.others.isEmpty()
		) {
			return;
		}

		const argIndex = currentArgIndex();
		const commandArgs = api.registry.getCommand(commandPath)?.options.arguments;
		if (argIndex === undefined || commandArgs === undefined) return;

		let newText = text();

		const parts = terminalTextParts();
		if (!endsWithSpace(newText) && !parts.isEmpty()) {
			newText = newText.sub(0, newText.size() - parts[parts.size() - 1].size());
		}

		let otherSuggestion = suggestion.others[0];
		if (string.match(otherSuggestion, "%s")[0] !== undefined) {
			otherSuggestion = `"${otherSuggestion}"`;
		}

		newText += otherSuggestion;
		if (argIndex < commandArgs.size() - 1) {
			newText += " ";
		}

		suggestionText("");
		text(newText);
		textBox.CursorPosition = newText.size() + 1;
	});

	return (
		<Frame
			anchorPoint={anchorPoint}
			size={size}
			position={position}
			backgroundColor={() => options().palette.surface}
			backgroundTransparency={backgroundTransparency}
			cornerRadius={() => new UDim(0, px(4))}
		>
			<Padding all={() => new UDim(0, px(8))} />

			<TextField
				action={(instance) => ref(instance)}
				size={UDim2.fromScale(1, 1)}
				text={() => {
					let value = text();

					// Remove line breaks
					if (value.match("[\n\r]")[0] !== undefined) {
						value = value.gsub("[\n\r]", "")[0];
					}

					// Remove all tabs from text input - we use these for autocompletion
					if (value.match("\t")[0] !== undefined) {
						value = value.gsub("\t", "")[0];
					}

					onTextChange?.(value);
					return value;
				}}
				textSize={() => px(TEXT_SIZE)}
				textColor={() => {
					return valid() ? options().palette.success : options().palette.error;
				}}
				textXAlignment="Left"
				placeholderText="Enter command..."
				placeholderColor={() => options().palette.subtext}
				font={() => options().font.medium}
				clearTextOnFocus={false}
				focusLost={(enterPressed) => {
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
					textBox.CaptureFocus();
					text("");
				}}
				textChanged={(currentText) => {
					const historyIndex = commandHistoryIndex();
					if (
						historyIndex !== undefined &&
						currentText !== commandHistory()[historyIndex]
					) {
						commandHistoryIndex(undefined);
					}

					text(currentText);
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
