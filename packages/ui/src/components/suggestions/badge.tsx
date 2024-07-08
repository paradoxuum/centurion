import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import React, { useContext } from "@rbxts/react";
import { usePx } from "../../hooks/use-px";
import { OptionsContext } from "../../providers/options-provider";
import { Frame } from "../ui/frame";
import { Text } from "../ui/text";

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

	children?: JSX.Element;
	backgroundTransparency?: number;
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
	children,
	backgroundTransparency,
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
			backgroundTransparency={backgroundTransparency}
		>
			<Text
				text={text}
				textColor={textColor}
				textSize={textSize}
				size={UDim2.fromScale(1, 1)}
				font={options.font.bold}
				change={{
					TextBounds: (rbx) => onTextBoundsChange?.(rbx.TextBounds),
				}}
			/>
			{children}
		</Frame>
	);
}
