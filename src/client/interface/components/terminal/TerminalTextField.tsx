import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { useEffect, useRef } from "@rbxts/roact";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Padding } from "../interface/Padding";
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

	useEffect(() => {
		const textBox = ref.current!;

		let prevText = "";
		textBox.GetPropertyChangedSignal("Text").Connect(() => {
			// Remove all tabs from text input - we use these for autocompletion
			if (textBox.Text.match("\t")[0] !== undefined) {
				textBox.Text = textBox.Text.gsub("\t", "")[0];
			}

			if (prevText !== textBox.Text) {
				onTextChange?.(textBox.Text);
				prevText = textBox.Text;
			}
		});
	}, [ref]);

	return (
		<Group key="text-field" anchorPoint={anchorPoint} size={size} position={position}>
			<TextField
				key="textbox"
				size={UDim2.fromScale(1, 1)}
				placeholderText="Enter command..."
				textColor={palette.white}
				textSize={20}
				textXAlignment="Left"
				textTruncate="AtEnd"
				clearTextOnFocus={false}
				font={fonts.inter.medium}
				ref={ref}
				event={{
					FocusLost: (rbx, enterPressed) => {
						if (!enterPressed) {
							return;
						}

						onSubmit?.(rbx.Text);
					},
				}}
			>
				<Padding all={new UDim(0, rem(1))} />
			</TextField>

			<Frame
				zIndex={0}
				backgroundColor={palette.mantle}
				size={UDim2.fromScale(1, 1)}
				cornerRadius={new UDim(0, rem(0.5))}
			/>
		</Group>
	);
}
