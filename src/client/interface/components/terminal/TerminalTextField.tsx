import { BindingOrValue, getBindingValue, useEventListener } from "@rbxts/pretty-react-hooks";
import Roact, { useBinding, useContext, useEffect, useRef } from "@rbxts/roact";
import { UserInputService } from "@rbxts/services";
import { endsWithSpace } from "../../../../shared/util/string";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { DataContext } from "../../providers/dataProvider";
import { SuggestionContext } from "../../providers/suggestionProvider";
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

	const [text, setText] = useBinding("");
	const [suggestionText, setSuggestionText] = useBinding("");

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
		if (ref.current === undefined) return;

		if (input.KeyCode === Enum.KeyCode.Tab) {
			const atCommand = store.getState().app.command !== undefined;
			const suggestionTextValue = getBindingValue(suggestionText);

			// Handle command suggestions
			if (!atCommand && suggestionTextValue !== undefined) {
				setText(suggestionTextValue);
				ref.current.CursorPosition = suggestionTextValue.size();
				return;
			}

			// Handle argument suggestions
			if (!atCommand || suggestion === undefined || suggestion.others.isEmpty()) return;

			let newText = getBindingValue(text);
			if (!endsWithSpace(newText)) {
				const parts = store.getState().app.text.parts;
				newText = newText.sub(0, newText.size() - parts[parts.size() - 1].size());
			}
			newText += suggestion.others[0];

			setText(newText);
			ref.current.CursorPosition = newText.size();
		}
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
						if (enterPressed) onSubmit?.(rbx.Text);
					},
				}}
				change={{
					Text: (rbx) => {
						let newText = rbx.Text;

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
