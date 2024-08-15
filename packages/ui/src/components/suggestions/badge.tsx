import Vide, { Derivable, InstanceAttributes } from "@rbxts/vide";
import { useAtom } from "../../hooks/use-atom";
import { px } from "../../hooks/use-px";
import { interfaceOptions } from "../../store";
import { Frame } from "../ui/frame";
import { Text } from "../ui/text";

interface BadgeProps {
	anchor?: Derivable<Vector2>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	color?: Derivable<Color3>;
	text?: Derivable<string>;
	textColor?: Derivable<Color3>;
	textSize?: Derivable<number>;
	visible?: Derivable<boolean>;
	children?: Vide.Node;
	backgroundTransparency?: number;
	native?: InstanceAttributes<TextLabel>;
}

export function Badge(props: BadgeProps) {
	const options = useAtom(interfaceOptions);

	return (
		<Frame
			backgroundColor={props.color}
			cornerRadius={() => new UDim(0, px(4))}
			backgroundTransparency={props.backgroundTransparency}
			clipsDescendants
			anchor={props.anchor}
			position={props.position}
			size={props.size}
			visible={props.visible}
		>
			<Text
				text={props.text}
				textColor={props.textColor}
				textSize={props.textSize}
				textXAlignment="Center"
				size={UDim2.fromScale(1, 1)}
				font={() => options().font.bold}
				{...props.native}
			>
				{props.children}
			</Text>
		</Frame>
	);
}
