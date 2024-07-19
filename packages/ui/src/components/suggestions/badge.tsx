import Vide, { Derivable } from "@rbxts/vide";
import { useAtom } from "../../hooks/use-atom";
import { px } from "../../hooks/use-px";
import { interfaceOptions } from "../../store";
import { Frame } from "../ui/frame";
import { Text } from "../ui/text";

interface BadgeProps {
	anchorPoint?: Derivable<Vector2>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	color?: Derivable<Color3>;
	text?: Derivable<string>;
	textColor?: Derivable<Color3>;
	textSize?: Derivable<number>;
	visible?: Derivable<boolean>;
	onTextBoundsChange?: (textBounds: Vector2) => void;
	children?: Vide.Node;
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
	const options = useAtom(interfaceOptions);

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
				font={() => options().font.bold}
				textBoundsChanged={onTextBoundsChange}
			/>
			{children}
		</Frame>
	);
}
