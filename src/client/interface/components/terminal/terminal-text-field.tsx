import {
	BindingOrValue,
	getBindingValue,
	useEventListener,
	useMountEffect,
} from "@rbxts/pretty-react-hooks";
import React, {
	useBinding,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { UserInputService } from "@rbxts/services";
import {
	endsWithSpace,
	formatPartsAsPath,
} from "../../../../shared/util/string";
import { CommanderClient } from "../../../core";
import { usePx } from "../../hooks/use-px";
import { useStore } from "../../hooks/use-store";
import { OptionsContext } from "../../providers/options-provider";
import { selectVisible } from "../../store/app";
import { selectCommand } from "../../store/command";
import { selectSuggestion } from "../../store/suggestion";
import { selectValid } from "../../store/text";
import { getArgumentNames } from "../../util/argument";
import { Frame } from "../interface/frame";
import { Padding } from "../interface/padding";
import { Text } from "../interface/text";
import { TextField } from "../interface/text-field";

interface TerminalTextFieldProps {
	anchorPoint?: BindingOrValue<Vector2>;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	backgroundTransparency?: BindingOrValue<number>;
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
	const px = usePx();
	const ref = useRef<TextBox>();
	const options = useContext(OptionsContext);
	const store = useStore();

	const appVisible = useSelector(selectVisible);
	const currentSuggestion = useSelector(selectSuggestion);
	const [text, setText] = useBinding("");
	const [suggestionText, setSuggestionText] = useBinding("");
	const [valid, setValid] = useState(false);

	const registry = useMemo(() => CommanderClient.registry(), []);

	const traverseHistory = useCallback((up: boolean) => {
		const history = store.getState().history.commandHistory;
		if (history.isEmpty()) return;

		const historyIndex = store.getState().history.commandHistoryIndex;
		if ((up && historyIndex === 0) || (!up && historyIndex === -1)) return;

		let newIndex: number;
		if (up) {
			newIndex = historyIndex === -1 ? history.size() - 1 : historyIndex - 1;
		} else {
			newIndex = historyIndex !== history.size() - 1 ? historyIndex + 1 : -1;
		}

		const newText = newIndex !== -1 ? history[newIndex] : "";
		setText(newText);
		setSuggestionText("");
		store.setCommandHistoryIndex(newIndex);

		if (ref.current !== undefined) {
			ref.current.CursorPosition = newText.size() + 1;
		}
	}, []);

	useEffect(() => {
		if (ref.current === undefined) return;

		if (appVisible) {
			ref.current.CaptureFocus();
		} else {
			ref.current.ReleaseFocus();
		}
	}, [appVisible]);

	useMountEffect(() => {
		store.subscribe(selectValid, (valid) => {
			setValid(valid);
		});

		store.subscribe(selectCommand, (command) => {
			if (!store.getState().text.valid) return;
			setValid(command !== undefined);
		});
	});

	useEffect(() => {
		if (currentSuggestion === undefined) {
			setSuggestionText("");
			return;
		}

		const state = store.getState();
		const atNextPart = endsWithSpace(state.text.value);
		const suggestionStartIndex =
			state.text.parts.size() > 0
				? (!atNextPart
						? state.text.parts[state.text.parts.size() - 1].size()
						: 0) + 1
				: -1;

		const command = state.command.path;
		const argIndex = state.command.argIndex;
		if (
			currentSuggestion.main.type === "command" &&
			suggestionStartIndex > -1
		) {
			setSuggestionText(
				getBindingValue(text) +
					currentSuggestion.main.title.sub(suggestionStartIndex),
			);
			return;
		}

		if (
			currentSuggestion.main.type !== "argument" ||
			command === undefined ||
			argIndex === undefined
		) {
			return;
		}

		let newText = getBindingValue(text);
		const argNames = getArgumentNames(command);
		for (const i of $range(argIndex, argNames.size() - 1)) {
			if (i === argIndex && !atNextPart) {
				if (!currentSuggestion.others.isEmpty()) {
					newText += currentSuggestion.others[0].sub(suggestionStartIndex);
				}

				newText += " ";
				continue;
			}

			newText = `${newText}${argNames[i]} `;
		}
		setSuggestionText(newText);
	}, [currentSuggestion]);

	useEventListener(UserInputService.InputBegan, (input) => {
		if (ref.current === undefined || !ref.current.IsFocused()) return;

		if (input.KeyCode === Enum.KeyCode.Up) {
			traverseHistory(true);
		} else if (input.KeyCode === Enum.KeyCode.Down) {
			traverseHistory(false);
		}

		if (input.KeyCode !== Enum.KeyCode.Tab) return;

		const state = store.getState();
		const commandPath = state.command.path;

		// Handle command suggestions
		if (commandPath === undefined) {
			const suggestionTitle = currentSuggestion?.main.title;
			if (suggestionTitle === undefined) return;

			const currentText = text.getValue();
			let newText = "";
			if (endsWithSpace(currentText)) {
				newText = currentText + suggestionTitle;
			} else if (!state.text.parts.isEmpty()) {
				const textPartSize =
					state.text.parts[state.text.parts.size() - 1].size();
				newText =
					currentText.sub(0, currentText.size() - textPartSize) +
					suggestionTitle;
			}

			const suggestionTextParts = suggestionText
				.getValue()
				.gsub("%s+", " ")[0]
				.split(" ");
			const nextCommand = registry.getCommandByString(
				formatPartsAsPath(suggestionTextParts),
			)?.options;
			if (
				nextCommand === undefined ||
				(nextCommand.arguments?.size() ?? 0) > 0
			) {
				newText += " ";
			}

			setSuggestionText("");
			setText(newText);
			ref.current.CursorPosition = newText.size() + 1;
			return;
		}

		// Handle argument suggestions
		if (
			commandPath === undefined ||
			currentSuggestion === undefined ||
			currentSuggestion.others.isEmpty()
		) {
			return;
		}

		const argIndex = state.command.argIndex;
		const commandArgs = registry.getCommand(commandPath)?.options.arguments;
		if (argIndex === undefined || commandArgs === undefined) return;

		let newText = getBindingValue(text);

		const parts = state.text.parts;
		if (!endsWithSpace(newText) && !parts.isEmpty()) {
			newText = newText.sub(0, newText.size() - parts[parts.size() - 1].size());
		}

		let suggestion = currentSuggestion.others[0];

		if (string.match(suggestion, "%s")[0] !== undefined) {
			suggestion = `"${suggestion}"`;
		}

		newText += suggestion;
		if (argIndex < commandArgs.size() - 1) {
			newText += " ";
		}

		setSuggestionText("");
		setText(newText);
		ref.current.CursorPosition = newText.size() + 1;
	});

	return (
		<Frame
			anchorPoint={anchorPoint}
			size={size}
			position={position}
			backgroundColor={options.palette.surface}
			backgroundTransparency={backgroundTransparency}
			cornerRadius={new UDim(0, px(4))}
		>
			<Padding all={new UDim(0, px(8))} />

			<TextField
				size={UDim2.fromScale(1, 1)}
				placeholderText="Enter command..."
				text={text}
				textSize={px(TEXT_SIZE)}
				textColor={valid ? options.palette.success : options.palette.error}
				placeholderColor={options.palette.subtext}
				textXAlignment="Left"
				clearTextOnFocus={false}
				font={options.font.medium}
				ref={ref}
				event={{
					FocusLost: (rbx, enterPressed) => {
						if (!enterPressed) return;
						store.addCommandHistory(
							rbx.Text,
							CommanderClient.options().historyLength,
						);
						store.setCommandHistoryIndex(-1);
						onSubmit?.(rbx.Text);
						ref.current?.CaptureFocus();
						setText("");
					},
				}}
				change={{
					Text: (rbx) => {
						let newText = rbx.Text;

						// Remove line breaks
						if (newText.match("[\n\r]")[0] !== undefined) {
							newText = newText.gsub("[\n\r]", "")[0];
						}

						// Remove all tabs from text input - we use these for autocompletion
						if (newText.match("\t")[0] !== undefined) {
							newText = newText.gsub("\t", "")[0];
						}

						// Reset command history index
						if (store.getState().history.commandHistoryIndex !== -1) {
							store.setCommandHistoryIndex(-1);
						}

						setText(newText);
						onTextChange?.(newText);
					},
				}}
				zIndex={2}
			/>

			<Text
				size={UDim2.fromScale(1, 1)}
				text={suggestionText}
				textColor={options.palette.subtext}
				textSize={px(TEXT_SIZE)}
				textXAlignment="Left"
				font={options.font.medium}
			/>
		</Frame>
	);
}
