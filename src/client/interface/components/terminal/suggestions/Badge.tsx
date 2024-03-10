import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { useContext } from "@rbxts/roact";
import { usePx } from "../../../hooks/usePx";
import { OptionsContext } from "../../../providers/optionsProvider";
import { Frame } from "../../interface/Frame";
import { Text } from "../../interface/Text";

interface BadgeProps {
	anchorPoint?: BindingOrValue<Vector2>;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	color?: BindingOrValue<Color3>;
	text?: BindingOrValue<string>;
	textColor?: BindingOrValue<Color3>;
	textSize?: BindingOrValue<number>;
	visible?: BindingOrValue<boolean>;

	onTextBoundsChange?: (textBounds: Vector2) => void;
}

export function Badge({
	anchorPoint,
	size,
	position,
	color,
	text,
	textColor,
	textSize,
	visible,
	onTextBoundsChange,
}: BadgeProps) {
	const options = useContext(OptionsContext);
	const px = usePx();

	return (
		<Frame
			anchorPoint={anchorPoint}
			size={size}
			position={position}
			backgroundColor={color}
			cornerRadius={new UDim(0, px(4))}
			visible={visible}
			clipsDescendants
		>
			<Text
				key="text"
				text={text}
				textColor={textColor}
				textSize={textSize}
				size={UDim2.fromScale(1, 1)}
				font={options.font.bold}
				change={{
					TextBounds: (rbx) => onTextBoundsChange?.(rbx.TextBounds),
				}}
			/>
		</Frame>
	);
}
