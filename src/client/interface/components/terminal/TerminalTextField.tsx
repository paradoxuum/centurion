import { BindingOrValue, useEventListener } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, { useBinding, useRef } from "@rbxts/roact";
import { UserInputService } from "@rbxts/services";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { selectSuggestionText } from "../../store/app";
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
	const store = useStore();

	const suggestionText = useSelector(selectSuggestionText);
	const [text, setText] = useBinding("");

	useEventListener(UserInputService.InputBegan, (input) => {
		if (ref.current === undefined) return;

		if (input.KeyCode === Enum.KeyCode.Tab) {
			const atCommand = store.getState().app.command !== undefined;
			if (!atCommand && suggestionText !== undefined) {
				setText(suggestionText);
				ref.current.CursorPosition = suggestionText.size();
			} // TODO Implement argument suggestions
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
