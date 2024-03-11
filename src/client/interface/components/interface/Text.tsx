import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import React, { Ref, forwardRef, useContext } from "@rbxts/react";
import { usePx } from "../../hooks/usePx";
import { OptionsContext } from "../../providers/optionsProvider";
import { FrameProps } from "./Frame";

export interface TextProps<T extends Instance = TextLabel>
	extends FrameProps<T> {
	font?: Font;
	text?: BindingOrValue<string>;
	textColor?: BindingOrValue<Color3>;
	textSize?: BindingOrValue<number>;
	textTransparency?: BindingOrValue<number>;
	textWrapped?: BindingOrValue<boolean>;
	textXAlignment?: React.InferEnumNames<Enum.TextXAlignment>;
	textYAlignment?: React.InferEnumNames<Enum.TextYAlignment>;
	textTruncate?: React.InferEnumNames<Enum.TextTruncate>;
	textScaled?: BindingOrValue<boolean>;
	textHeight?: BindingOrValue<number>;
	textAutoResize?: "X" | "Y" | "XY";
	richText?: BindingOrValue<boolean>;
	maxVisibleGraphemes?: BindingOrValue<number>;
}

export const Text = forwardRef((props: TextProps, ref: Ref<TextLabel>) => {
	const px = usePx();
	const options = useContext(OptionsContext);

	return (
		<textlabel
			ref={ref}
			Font={Enum.Font.Unknown}
			FontFace={props.font ?? options.font.regular}
			Text={props.text}
			TextColor3={props.textColor}
			TextSize={props.textSize ?? px(16)}
			TextTransparency={props.textTransparency}
			TextWrapped={props.textWrapped}
			TextXAlignment={props.textXAlignment}
			TextYAlignment={props.textYAlignment}
			TextTruncate={props.textTruncate}
			TextScaled={props.textScaled}
			LineHeight={props.textHeight}
			RichText={props.richText}
			MaxVisibleGraphemes={props.maxVisibleGraphemes}
			Size={props.size}
			AutomaticSize={props.textAutoResize}
			Position={props.position}
			AnchorPoint={props.anchorPoint}
			BackgroundColor3={props.backgroundColor}
			BackgroundTransparency={props.backgroundTransparency ?? 1}
			ClipsDescendants={props.clipsDescendants}
			Visible={props.visible}
			ZIndex={props.zIndex}
			LayoutOrder={props.layoutOrder}
			Change={props.change || {}}
			Event={props.event || {}}
		>
			{props.cornerRadius && <uicorner CornerRadius={props.cornerRadius} />}
			{props.children}
		</textlabel>
	);
});
