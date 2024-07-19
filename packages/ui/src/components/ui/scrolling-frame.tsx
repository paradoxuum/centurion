import Vide, { Derivable, InferEnumNames } from "@rbxts/vide";
import { FrameProps } from "./frame";

export interface ScrollingFrameProps extends FrameProps<ScrollingFrame> {
	automaticSize?: InferEnumNames<Enum.AutomaticSize>;
	automaticCanvasSize?: InferEnumNames<Enum.AutomaticSize>;
	scrollingDirection?: InferEnumNames<Enum.ScrollingDirection>;
	scrollBarThickness?: Derivable<number>;
	scrollBarColor?: Derivable<Color3>;
	scrollBarTransparency?: Derivable<number>;
	scrollingEnabled?: Derivable<boolean>;
	canvasSize?: Derivable<UDim2>;
	canvasPosition?: Derivable<Vector2>;
}

export function ScrollingFrame(props: ScrollingFrameProps) {
	return (
		<scrollingframe
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
		>
			{props.cornerRadius && <uicorner CornerRadius={props.cornerRadius} />}
			{props.children}
		</scrollingframe>
	);
}
