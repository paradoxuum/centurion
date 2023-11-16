import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact from "@rbxts/roact";
import { fonts } from "../../../constants/fonts";
import { useRem } from "../../../hooks/useRem";
import { Frame } from "../../interface/Frame";
import { Padding } from "../../interface/Padding";
import { Text } from "../../interface/Text";

interface BadgeProps {
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	color?: BindingOrValue<Color3>;
	text?: BindingOrValue<string>;
	textColor?: BindingOrValue<Color3>;
}

export function Badge({ size, position, color, text, textColor }: BadgeProps) {
	const rem = useRem();

	return (
		<Frame size={size} position={position} backgroundColor={color} cornerRadius={new UDim(1)}>
			<Padding key="padding" all={new UDim(0, rem(1))} />

			<Text
				key="text"
				text={text}
				textColor={textColor}
				textSize={rem(1)}
				size={UDim2.fromScale(1, 1)}
				font={fonts.inter.bold}
			/>
		</Frame>
	);
}
