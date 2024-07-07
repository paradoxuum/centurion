import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import React, { forwardRef } from "@rbxts/react";

interface GroupProps extends React.PropsWithChildren {
	ref?: React.Ref<Frame>;
	event?: React.InstanceEvent<Frame>;
	change?: React.InstanceChangeEvent<Frame>;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	anchorPoint?: BindingOrValue<Vector2>;
	rotation?: BindingOrValue<number>;
	clipsDescendants?: BindingOrValue<boolean>;
	layoutOrder?: BindingOrValue<number>;
	visible?: BindingOrValue<boolean>;
	zIndex?: BindingOrValue<number>;
}

export const Group = forwardRef((props: GroupProps, ref: React.Ref<Frame>) => {
	return (
		<frame
			ref={ref}
			Size={props.size || UDim2.fromScale(1, 1)}
			Position={props.position}
			AnchorPoint={props.anchorPoint}
			Rotation={props.rotation}
			ClipsDescendants={props.clipsDescendants}
			LayoutOrder={props.layoutOrder}
			Visible={props.visible}
			ZIndex={props.zIndex}
			BackgroundTransparency={1}
			Event={props.event || {}}
			Change={props.change || {}}
		>
			{props.children}
		</frame>
	);
});
