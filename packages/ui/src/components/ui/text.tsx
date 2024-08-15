import Vide, { Derivable, InferEnumNames, read } from "@rbxts/vide";
import { useAtom } from "../../hooks/use-atom";
import { px } from "../../hooks/use-px";
import { interfaceOptions } from "../../store";
import { FrameProps } from "./frame";

export interface TextProps<T extends Instance = TextLabel>
	extends FrameProps<T> {
	font?: Derivable<Font>;
	text?: Derivable<string>;
	textColor?: Derivable<Color3>;
	textSize?: Derivable<number>;
	textTransparency?: Derivable<number>;
	textWrapped?: Derivable<boolean>;
	textXAlignment?: InferEnumNames<Enum.TextXAlignment>;
	textYAlignment?: InferEnumNames<Enum.TextYAlignment>;
	textTruncate?: InferEnumNames<Enum.TextTruncate>;
	textScaled?: Derivable<boolean>;
	textHeight?: Derivable<number>;
	textAutoResize?: "X" | "Y" | "XY";
	richText?: Derivable<boolean>;
}

export function Text(props: TextProps) {
	const options = useAtom(interfaceOptions);

	return (
		<textlabel
			FontFace={() => read(props.font) ?? options().font.regular}
			Text={props.text}
			TextColor3={props.textColor}
			TextSize={() => read(props.textSize) ?? px(16)}
			TextTransparency={props.textTransparency}
			TextWrapped={props.textWrapped}
			TextXAlignment={props.textXAlignment}
			TextYAlignment={props.textYAlignment}
			TextTruncate={props.textTruncate}
			TextScaled={props.textScaled}
			LineHeight={props.textHeight}
			RichText={props.richText}
			Size={props.size}
			AutomaticSize={props.textAutoResize}
			Position={props.position}
			AnchorPoint={props.anchor}
			BackgroundColor3={props.backgroundColor}
			BackgroundTransparency={props.backgroundTransparency ?? 1}
			ClipsDescendants={props.clipsDescendants}
			Visible={props.visible}
			ZIndex={props.zIndex}
			LayoutOrder={props.layoutOrder}
			action={props.action}
			{...props.native}
		>
			{props.cornerRadius && <uicorner CornerRadius={props.cornerRadius} />}
			{props.children}
		</textlabel>
	);
}
