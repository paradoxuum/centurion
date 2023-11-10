import Roact from "@rbxts/roact";
import { FrameProps } from "./Frame";

export interface ScrollingListProps extends FrameProps<ScrollingFrame> {}

export default function ScrollingList(props: ScrollingListProps) {
	return (
		<scrollingframe
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
		></scrollingframe>
	);
}
