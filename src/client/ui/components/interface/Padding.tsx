import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact from "@rbxts/roact";

interface Props {
	all?: BindingOrValue<UDim>;
	left?: BindingOrValue<UDim>;
	right?: BindingOrValue<UDim>;
	top?: BindingOrValue<UDim>;
	bottom?: BindingOrValue<UDim>;
}

export function Padding({ all, left, right, top, bottom }: Props) {
	return (
		<uipadding
			PaddingLeft={left ?? all}
			PaddingRight={right ?? all}
			PaddingTop={top ?? all}
			PaddingBottom={bottom ?? all}
		/>
	);
}
