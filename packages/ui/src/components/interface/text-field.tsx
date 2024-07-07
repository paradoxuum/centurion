import { Ref, forwardRef, useContext } from "@rbxts/react";

import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";
import { OptionsContext } from "../../providers/options-provider";
import { TextProps } from "./text";

interface TextFieldProps extends TextProps<TextBox> {
	text?: BindingOrValue<string>;
	placeholderText?: BindingOrValue<string>;
	placeholderColor?: BindingOrValue<Color3>;
	clearTextOnFocus?: BindingOrValue<boolean>;
	multiLine?: BindingOrValue<boolean>;
	textEditable?: BindingOrValue<boolean>;
}

export const TextField = forwardRef(
	(props: TextFieldProps, ref: Ref<TextBox>) => {
		const options = useContext(OptionsContext);

		return (
			<textbox
				ref={ref}
				PlaceholderText={props.placeholderText}
				PlaceholderColor3={props.placeholderColor}
				ClearTextOnFocus={props.clearTextOnFocus}
				MultiLine={props.multiLine}
				TextEditable={props.textEditable}
				Font={Enum.Font.Unknown}
				FontFace={props.font ?? options.font.regular}
				Text={props.text}
				TextColor3={props.textColor}
				TextSize={props.textSize}
				TextTransparency={props.textTransparency}
				TextTruncate={props.textTruncate}
				TextWrapped={props.textWrapped}
				TextXAlignment={props.textXAlignment}
				TextYAlignment={props.textYAlignment}
				TextScaled={props.textScaled}
				RichText={props.richText}
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
				Event={props.event ?? {}}
				Change={props.change ?? {}}
			>
				{props.cornerRadius && <uicorner CornerRadius={props.cornerRadius} />}
				{props.children}
			</textbox>
		);
	},
);
