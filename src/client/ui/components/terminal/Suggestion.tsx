import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact from "@rbxts/roact";
import { fonts } from "../../constants/fonts";
import { useRem } from "../../hooks/useRem";
import { ReactiveButton } from "../interface/ReactiveButton";
import { Text } from "../interface/Text";

interface SuggestionProps {
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	text?: BindingOrValue<string>;
	textColor?: BindingOrValue<Color3>;
	color?: BindingOrValue<Color3>;
}

export default function Suggestion({ size, position, text, textColor, color }: SuggestionProps) {
	const rem = useRem();

	return (
		<ReactiveButton
			size={size}
			position={position}
			animateSizeStrength={0.4}
			animatePosition={false}
			cornerRadius={new UDim(0, rem(0.25))}
			backgroundColor={color}
		>
			<Text size={UDim2.fromScale(1, 1)} text={text} textColor={textColor} font={fonts.inter.bold} />
		</ReactiveButton>
	);
}
