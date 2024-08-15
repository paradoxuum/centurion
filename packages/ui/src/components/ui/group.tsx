import Vide, { Derivable } from "@rbxts/vide";
import { FrameProps } from "./frame";

interface GroupProps
	extends Omit<FrameProps, "backgroundTransparency" | "backgroundColor"> {
	name?: Derivable<string>;
	anchor?: Derivable<Vector2>;
	position?: Derivable<UDim2>;
	size?: Derivable<UDim2>;
	rotation?: Derivable<number>;
	clipsDescendants?: Derivable<boolean>;
	layoutOrder?: Derivable<number>;
	visible?: Derivable<boolean>;
	zIndex?: Derivable<number>;
}

export function Group(props: GroupProps) {
	return (
		<frame
			AutomaticSize={props.automaticSize}
			AnchorPoint={props.anchor}
			Position={props.position}
			Size={props.size ?? UDim2.fromScale(1, 1)}
			Rotation={props.rotation}
			BackgroundTransparency={1}
			ClipsDescendants={props.clipsDescendants}
			Visible={props.visible}
			ZIndex={props.zIndex}
			LayoutOrder={props.layoutOrder}
			action={props.action}
			BorderSizePixel={0}
			{...props.native}
		>
			{props.children}
		</frame>
	);
}
