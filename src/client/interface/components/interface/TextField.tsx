import Roact, { Ref, forwardRef, useEffect, useRef } from "@rbxts/roact";

import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import { fonts } from "../../constants/fonts";
import { Group } from "./Group";
import { TextProps } from "./Text";

const GRADIENT = new NumberSequence([
	new NumberSequenceKeypoint(0, 0),
	new NumberSequenceKeypoint(0.75, 0),
	new NumberSequenceKeypoint(1, 1),
]);

interface TextFieldProps extends TextProps<TextBox> {
	text?: string;
	placeholderText?: BindingOrValue<string>;
	placeholderColor?: BindingOrValue<Color3>;
	clearTextOnFocus?: BindingOrValue<boolean>;
	multiLine?: BindingOrValue<boolean>;
	textEditable?: BindingOrValue<boolean>;
}

export const TextField = forwardRef((props: TextFieldProps, ref: Ref<TextBox>) => {
	const childRef = useRef<Frame>();
	useEffect(() => {
		if (childRef.current !== undefined && childRef.current.Parent?.IsA("TextBox")) {
			childRef.current.Parent.Text = props.text ?? "";
		}
	}, [childRef, props.text]);

	return (
		<textbox
			ref={ref}
			PlaceholderText={props.placeholderText}
			PlaceholderColor3={props.placeholderColor}
			ClearTextOnFocus={props.clearTextOnFocus}
			MultiLine={props.multiLine}
			TextEditable={props.textEditable}
			Font={Enum.Font.Unknown}
			FontFace={props.font || fonts.inter.regular}
			TextColor3={props.textColor}
			TextSize={props.textSize}
			TextTransparency={props.textTransparency}
			TextTruncate={props.textTruncate}
			TextWrapped={props.textWrapped}
			TextXAlignment={props.textXAlignment}
			TextYAlignment={props.textYAlignment}
			TextScaled={props.textScaled}
			AutomaticSize={props.textAutoResize}
			Size={props.size}
			Position={props.position}
			AnchorPoint={props.anchorPoint}
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
			<Group key="ref" ref={childRef} />
			{props.cornerRadius && <uicorner key="corner" CornerRadius={props.cornerRadius} />}
			{props.children}
		</textbox>
	);
});
