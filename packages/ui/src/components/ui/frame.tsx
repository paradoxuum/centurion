import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import React, { InferEnumNames, Ref, forwardRef } from "@rbxts/react";

export interface FrameProps<T extends Instance = Frame>
	extends React.PropsWithChildren {
	ref?: React.Ref<T>;
	event?: React.InstanceEvent<T>;
	change?: React.InstanceChangeEvent<T>;
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
	automaticSize?: InferEnumNames<Enum.AutomaticSize>;
}

export const Frame = forwardRef((props: FrameProps, ref: Ref<Frame>) => {
	return (
		<frame
			ref={ref}
			AutomaticSize={props.automaticSize}
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
			{props.cornerRadius && <uicorner CornerRadius={props.cornerRadius} />}
			{props.children}
		</frame>
	);
});
