import { BindingOrValue, getBindingValue, useEventListener } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, { useBinding, useContext, useEffect, useRef } from "@rbxts/roact";
import { UserInputService } from "@rbxts/services";
import { endsWithSpace, formatPartsAsPath } from "../../../../shared/util/string";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { DataContext } from "../../providers/dataProvider";
import { SuggestionContext } from "../../providers/suggestionProvider";
import { selectVisible } from "../../store/app";
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

export function TerminalTextField({ anchorPoint, size, position, onTextChange, onSubmit }: TerminalTextFieldProps) {
	const rem = useRem();
	const ref = useRef<TextBox>();
	const data = useContext(DataContext);
	const suggestion = useContext(SuggestionContext).suggestion;
	const store = useStore();

	const appVisible = useSelector(selectVisible);
	const [text, setText] = useBinding("");
	const [suggestionText, setSuggestionText] = useBinding("");

	useEffect(() => {
		if (ref.current === undefined) return;

		if (appVisible) {
			ref.current.CaptureFocus();
		} else {
			ref.current.ReleaseFocus();
		}
	}, [appVisible]);

	useEffect(() => {
		if (suggestion === undefined) {
			setSuggestionText("");
			return;
		}

		const parts = store.getState().app.text.parts;
		const atNextPart = endsWithSpace(store.getState().app.text.value);

		let newText = getBindingValue(text);
		if (suggestion.main.type === "argument") {
			const command = store.getState().app.command!;
			const argIndex = store.getState().app.argIndex!;
			const argNames = getArgumentNames(command);

			for (const i of $range(argIndex, argNames.size() - 1)) {
				const firstArg = i === argIndex;
				if (firstArg && !atNextPart) {
					newText += " ";
					continue;
				}

				newText += argNames[i] + " ";
			}
		} else {
			const suggestionStartIndex = (!atNextPart ? parts[parts.size() - 1].size() : 0) + 1;
			newText += suggestion.main.title.sub(suggestionStartIndex);
		}

		setSuggestionText(newText);
	}, [suggestion]);

	useEventListener(UserInputService.InputBegan, (input) => {
		if (ref.current === undefined || input.KeyCode !== Enum.KeyCode.Tab) return;

		const commandPath = store.getState().app.command;
		const suggestionTextValue = getBindingValue(suggestionText);

		// Handle command suggestions
		if (commandPath === undefined && suggestionTextValue !== undefined) {
			const suggestionTextParts = suggestionTextValue.gsub("%s+", " ")[0].split(" ");
			const nextCommand = data.commands.get(formatPartsAsPath(suggestionTextParts));

			let newText = suggestionTextValue;
			if (nextCommand === undefined || (nextCommand.arguments?.size() ?? 0) > 0) {
				newText += " ";
			}

			setSuggestionText("");
			setText(newText);
			ref.current.CursorPosition = newText.size() + 1;
		}

		// Handle argument suggestions
		if (commandPath === undefined || suggestion === undefined || suggestion.others.isEmpty()) return;

		const argIndex = store.getState().app.argIndex;
		const commandArgs = data.commands.get(commandPath.toString())?.arguments;
		if (argIndex === undefined || commandArgs === undefined) return;

		let newText = getBindingValue(text);
		if (!endsWithSpace(newText)) {
			const parts = store.getState().app.text.parts;
			newText = newText.sub(0, newText.size() - parts[parts.size() - 1].size());
		}
		newText += suggestion.others[0];

		print(argIndex, commandArgs.size() - 1);
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
				textColor={palette.white}
				textSize={rem(2)}
				textXAlignment="Left"
				clearTextOnFocus={false}
				font={fonts.inter.medium}
				ref={ref}
				event={{
					FocusLost: (rbx, enterPressed) => {
						if (!enterPressed) return;
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
