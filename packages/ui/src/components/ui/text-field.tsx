import Vide, { Derivable, read } from "@rbxts/vide";
import { useAtom } from "../../hooks/use-atom";
import { interfaceOptions } from "../../store";
import { TextProps } from "./text";

interface TextFieldProps extends TextProps<TextBox> {
	text?: Derivable<string>;
	placeholderText?: Derivable<string>;
	placeholderColor?: Derivable<Color3>;
	clearTextOnFocus?: Derivable<boolean>;
	multiLine?: Derivable<boolean>;
	textEditable?: Derivable<boolean>;
}

export function TextField(props: TextFieldProps) {
	const options = useAtom(interfaceOptions);

	return (
		<textbox
			PlaceholderText={props.placeholderText}
			PlaceholderColor3={props.placeholderColor}
			ClearTextOnFocus={props.clearTextOnFocus}
			MultiLine={props.multiLine}
			TextEditable={props.textEditable}
			Font={Enum.Font.Unknown}
			FontFace={() => {
				return read(props.font) ?? options().font.regular;
			}}
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
			AutoLocalize={() => options().autoLocalize}
			Size={props.size}
			Position={props.position}
			AnchorPoint={props.anchor}
			BackgroundColor3={props.backgroundColor}
			BackgroundTransparency={props.backgroundTransparency ?? 1}
			ClipsDescendants={props.clipsDescendants}
			Visible={props.visible}
			ZIndex={props.zIndex}
			LayoutOrder={props.layoutOrder}
			BorderSizePixel={0}
			action={props.action}
			{...props.native}
		>
			{props.cornerRadius && <uicorner CornerRadius={props.cornerRadius} />}
			{props.children}
		</textbox>
	);
}
