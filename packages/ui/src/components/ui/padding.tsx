import Vide, { Derivable } from "@rbxts/vide";

interface Props {
	all?: Derivable<UDim>;
	left?: Derivable<UDim>;
	right?: Derivable<UDim>;
	top?: Derivable<UDim>;
	bottom?: Derivable<UDim>;
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
