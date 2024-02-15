import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { Ref, forwardRef } from "@rbxts/roact";
import { DEFAULT_FONT } from "../../constants/fonts";
import { usePx } from "../../hooks/usePx";
import { FrameProps } from "./Frame";

export interface TextProps<T extends Instance = TextLabel>
	extends FrameProps<T> {
	font?: Font;
	text?: BindingOrValue<string>;
	textColor?: BindingOrValue<Color3>;
	textSize?: BindingOrValue<number>;
	textTransparency?: BindingOrValue<number>;
	textWrapped?: BindingOrValue<boolean>;
	textXAlignment?: Roact.InferEnumNames<Enum.TextXAlignment>;
	textYAlignment?: Roact.InferEnumNames<Enum.TextYAlignment>;
	textTruncate?: Roact.InferEnumNames<Enum.TextTruncate>;
	textScaled?: BindingOrValue<boolean>;
	textHeight?: BindingOrValue<number>;
	textAutoResize?: "X" | "Y" | "XY";
	richText?: BindingOrValue<boolean>;
	maxVisibleGraphemes?: BindingOrValue<number>;
}

export const Text = forwardRef((props: TextProps, ref: Ref<TextLabel>) => {
	const px = usePx();

	return (
		<textlabel
			ref={ref}
			Font={Enum.Font.Unknown}
			FontFace={props.font || DEFAULT_FONT}
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
			{props.cornerRadius && (
				<uicorner key="corner" CornerRadius={props.cornerRadius} />
			)}
			{props.children}
		</textlabel>
	);
});
