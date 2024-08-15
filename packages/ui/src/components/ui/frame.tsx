import Vide, {
	ActionAttributes,
	Derivable,
	InferEnumNames,
	InstanceAttributes,
} from "@rbxts/vide";

export interface FrameProps<T extends Instance = Frame>
	extends ActionAttributes<T> {
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	anchor?: Derivable<Vector2>;
	rotation?: Derivable<number>;
	backgroundColor?: Derivable<Color3>;
	backgroundTransparency?: Derivable<number>;
	clipsDescendants?: Derivable<boolean>;
	visible?: Derivable<boolean>;
	zIndex?: Derivable<number>;
	layoutOrder?: Derivable<number>;
	cornerRadius?: Derivable<UDim>;
	automaticSize?: InferEnumNames<Enum.AutomaticSize>;
	native?: InstanceAttributes<T>;
}

export function Frame(props: FrameProps) {
	return (
		<frame
			AutomaticSize={props.automaticSize}
			Size={props.size}
			Position={props.position}
			AnchorPoint={props.anchor}
			Rotation={props.rotation}
			BackgroundColor3={props.backgroundColor}
			BackgroundTransparency={props.backgroundTransparency}
			ClipsDescendants={props.clipsDescendants}
			Visible={props.visible}
			ZIndex={props.zIndex}
			LayoutOrder={props.layoutOrder}
			action={props.action}
			BorderSizePixel={0}
			{...props.native}
		>
			{props.cornerRadius && <uicorner CornerRadius={props.cornerRadius} />}
			{props.children}
		</frame>
	);
}
