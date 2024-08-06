import Vide, { Derivable } from "@rbxts/vide";

interface GroupProps extends Vide.PropsWithChildren {
	name?: Derivable<string>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	anchorPoint?: Derivable<Vector2>;
	rotation?: Derivable<number>;
	clipsDescendants?: Derivable<boolean>;
	layoutOrder?: Derivable<number>;
	visible?: Derivable<boolean>;
	zIndex?: Derivable<number>;
	mouseEnter?: () => void;
	mouseLeave?: () => void;
}

export function Group(props: GroupProps) {
	return (
		<frame
			Name={props.name}
			Size={props.size || UDim2.fromScale(1, 1)}
			Position={props.position}
			AnchorPoint={props.anchorPoint}
			Rotation={props.rotation}
			ClipsDescendants={props.clipsDescendants}
			LayoutOrder={props.layoutOrder}
			Visible={props.visible}
			ZIndex={props.zIndex}
			BackgroundTransparency={1}
			MouseEnter={props.mouseEnter}
			MouseLeave={props.mouseLeave}
		>
			{props.children}
		</frame>
	);
}
