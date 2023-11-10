import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { forwardRef, Ref } from "@rbxts/roact";

export interface FrameProps<T extends Instance = Frame> extends Roact.PropsWithChildren {
	ref?: Roact.Ref<T>;
	event?: Roact.JsxInstanceEvents<T>;
	change?: Roact.JsxInstanceChangeEvents<T>;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	anchorPoint?: BindingOrValue<Vector2>;
	rotation?: BindingOrValue<number>;
	backgroundColor?: BindingOrValue<Color3>;
	backgroundTransparency?: BindingOrValue<number>;
	clipsDescendants?: BindingOrValue<boolean>;
	visible?: BindingOrValue<boolean>;
	zIndex?: BindingOrValue<number>;
	layoutOrder?: BindingOrValue<number>;
	cornerRadius?: BindingOrValue<UDim>;
}

export const Frame = forwardRef((props: FrameProps, ref: Ref<Frame>) => {
	return (
		<frame
			ref={ref}
			Size={props.size}
			Position={props.position}
			AnchorPoint={props.anchorPoint}
			Rotation={props.rotation}
			BackgroundColor3={props.backgroundColor}
			BackgroundTransparency={props.backgroundTransparency}
			ClipsDescendants={props.clipsDescendants}
			Visible={props.visible}
			ZIndex={props.zIndex}
			LayoutOrder={props.layoutOrder}
			BorderSizePixel={0}
			Event={props.event || {}}
			Change={props.change || {}}
		>
			{props.cornerRadius && <uicorner key="corner" CornerRadius={props.cornerRadius} />}
			{props.children}
		</frame>
	);
});
