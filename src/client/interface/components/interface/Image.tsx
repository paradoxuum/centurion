import Roact from "@rbxts/roact";

import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import { FrameProps } from "./Frame";

export interface ImageProps extends FrameProps<ImageLabel> {
	image: string;
	imageColor?: BindingOrValue<Color3>;
	imageTransparency?: BindingOrValue<number>;
	imageRectOffset?: BindingOrValue<Vector2>;
	imageRectSize?: BindingOrValue<Vector2>;
	scaleType?: Roact.InferEnumNames<Enum.ScaleType>;
	sliceScale?: BindingOrValue<number>;
	sliceCenter?: BindingOrValue<Rect>;
	tileSize?: BindingOrValue<UDim2>;
}

export function Image(props: ImageProps) {
	return (
		<imagelabel
			Image={props.image}
			ImageColor3={props.imageColor}
			ImageTransparency={props.imageTransparency}
			ImageRectOffset={props.imageRectOffset}
			ImageRectSize={props.imageRectSize}
			ScaleType={props.scaleType}
			SliceScale={props.sliceScale}
			SliceCenter={props.sliceCenter}
			TileSize={props.tileSize}
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
			{props.cornerRadius && (
				<uicorner key="corner" CornerRadius={props.cornerRadius} />
			)}
			{props.children}
		</imagelabel>
	);
}
