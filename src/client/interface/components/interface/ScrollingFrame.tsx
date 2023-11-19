import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { Ref, forwardRef } from "@rbxts/roact";
import { FrameProps } from "./Frame";

export interface ScrollingFrameProps extends FrameProps<ScrollingFrame> {
	automaticSize?: Roact.InferEnumNames<Enum.AutomaticSize>;
	automaticCanvasSize?: Roact.InferEnumNames<Enum.AutomaticSize>;
	scrollingDirection?: Roact.InferEnumNames<Enum.ScrollingDirection>;
	scrollBarThickness?: BindingOrValue<number>;
	scrollBarColor?: BindingOrValue<Color3>;
	scrollBarTransparency?: BindingOrValue<number>;
	scrollingEnabled?: BindingOrValue<boolean>;
	canvasSize?: BindingOrValue<UDim2>;
	canvasPosition?: BindingOrValue<Vector2>;
}

export const ScrollingFrame = forwardRef((props: ScrollingFrameProps, ref: Ref<ScrollingFrame>) => {
	return (
		<scrollingframe
			ref={ref}
			AutomaticSize={props.automaticSize}
			AutomaticCanvasSize={props.automaticCanvasSize}
			ScrollingDirection={props.scrollingDirection}
			ScrollBarThickness={props.scrollBarThickness}
			ScrollBarImageColor3={props.scrollBarColor}
			ScrollBarImageTransparency={props.scrollBarTransparency}
			ScrollingEnabled={props.scrollingEnabled}
			CanvasSize={props.canvasSize}
			CanvasPosition={props.canvasPosition}
			Size={props.size}
			Position={props.position}
			AnchorPoint={props.anchorPoint}
			Rotation={props.rotation}
			BackgroundColor3={props.backgroundColor}
			BackgroundTransparency={props.backgroundTransparency ?? 1}
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
		</scrollingframe>
	);
});
