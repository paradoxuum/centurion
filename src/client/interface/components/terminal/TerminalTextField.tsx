import {
	BindingOrValue,
	getBindingValue,
	useEventListener,
	useMountEffect,
} from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, {
	useBinding,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "@rbxts/roact";
import { UserInputService } from "@rbxts/services";
import {
	endsWithSpace,
	formatPartsAsPath,
} from "../../../../shared/util/string";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { CommanderContext } from "../../providers/commanderProvider";
import { selectVisible } from "../../store/app";
import { selectCommand } from "../../store/command";
import { selectCurrentSuggestion } from "../../store/suggestion";
import { selectValid } from "../../store/text";
import { getArgumentNames } from "../../util/argument";
import { Frame } from "../interface/Frame";
import { Padding } from "../interface/Padding";
import { Text } from "../interface/Text";
import { TextField } from "../interface/TextField";

interface TerminalTextFieldProps {
	anchorPoint?: BindingOrValue<Vector2>;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	onTextChange?: (text: string) => void;
	onSubmit?: (text: string) => void;
}

export function TerminalTextField({
	anchorPoint,
	size,
	position,
	onTextChange,
	onSubmit,
}: TerminalTextFieldProps) {
	const rem = useRem();
	const ref = useRef<TextBox>();
	const data = useContext(CommanderContext);
	const store = useStore();

	const appVisible = useSelector(selectVisible);
	const currentSuggestion = useSelector(selectCurrentSuggestion);
	const [text, setText] = useBinding("");
	const [suggestionText, setSuggestionText] = useBinding("");
	const [valid, setValid] = useState(false);

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
		const parts = state.text.parts;
		const atNextPart = endsWithSpace(state.text.value);

		let newText = getBindingValue(text);
		const command = state.command.path;
		const argIndex = state.command.argIndex;
		if (
			currentSuggestion.main.type === "argument" &&
			command !== undefined &&
			argIndex !== undefined
		) {
			const argNames = getArgumentNames(command);
			for (const i of $range(argIndex, argNames.size() - 1)) {
				const firstArg = i === argIndex;
				if (firstArg && !atNextPart) {
					newText += " ";
					continue;
				}

				newText = `${newText}${argNames[i]} `;
			}
		} else if (currentSuggestion.main.type === "command" && !parts.isEmpty()) {
			const suggestionStartIndex =
				(!atNextPart ? parts[parts.size() - 1].size() : 0) + 1;
			newText += currentSuggestion.main.title.sub(suggestionStartIndex);
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
		const suggestionTextValue = getBindingValue(suggestionText);

		// Handle command suggestions
		if (commandPath === undefined && suggestionTextValue !== "") {
			const suggestionTextParts = suggestionTextValue
				.gsub("%s+", " ")[0]
				.split(" ");

			const nextCommand = data.commands.get(
				formatPartsAsPath(suggestionTextParts),
			);

			let newText = suggestionTextValue;
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
		const commandArgs = data.commands.get(commandPath.toString())?.arguments;
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
			backgroundColor={palette.mantle}
			cornerRadius={new UDim(0, rem(0.5))}
		>
			<Padding key="padding" all={new UDim(0, rem(1))} />

			<TextField
				key="textbox"
				size={UDim2.fromScale(1, 1)}
				placeholderText="Enter command..."
				text={text}
				textSize={rem(2)}
				textColor={valid ? palette.green : palette.red}
				textXAlignment="Left"
				clearTextOnFocus={false}
				font={fonts.inter.medium}
				ref={ref}
				event={{
					FocusLost: (rbx, enterPressed) => {
						if (!enterPressed) return;
						store.addCommandHistory(rbx.Text, data.options.historyLength);
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
				key="suggestion-text"
				size={UDim2.fromScale(1, 1)}
				text={suggestionText}
				textColor={palette.surface2}
				textSize={rem(2)}
				textXAlignment="Left"
				font={fonts.inter.medium}
			/>
		</Frame>
	);
}
