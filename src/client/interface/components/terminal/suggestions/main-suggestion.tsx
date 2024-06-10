import { BindingOrValue, lerpBinding } from "@rbxts/pretty-react-hooks";
import React, { Binding, useContext, useEffect } from "@rbxts/react";
import { springs } from "../../../constants/springs";
import {
	SUGGESTION_TEXT_SIZE,
	SUGGESTION_TITLE_TEXT_SIZE,
} from "../../../constants/text";
import { useMotion } from "../../../hooks/use-motion";
import { usePx } from "../../../hooks/use-px";
import {
	InterfaceOptionsWithState,
	OptionsContext,
} from "../../../providers/options-provider";
import {
	ArgumentSuggestion,
	CommandSuggestion,
	Suggestion,
} from "../../../types";
import { Frame } from "../../interface/frame";
import { Padding } from "../../interface/padding";
import { Text } from "../../interface/text";
import { Badge } from "./badge";
import { SuggestionTextBounds } from "./types";
import { highlightMatching } from "./util";
import { ShortcutGroup } from "../../interface/shortcut-group";

export interface MainSuggestionProps {
	suggestion?: Suggestion;
	argument: BindingOrValue<boolean>;
	currentText?: string;
	size: BindingOrValue<UDim2>;
	sizes: Binding<SuggestionTextBounds>;
}

function showKeybindsGui(props: {
	options: InterfaceOptionsWithState;
	suggestion: Suggestion | undefined;
}) {
	if (
		props.suggestion &&
		props.suggestion.main.type === "command" &&
		(props.suggestion.main as CommandSuggestion).shortcuts !== undefined &&
		props.options.shortcutsEnabled
	) {
		return true;
	}
}

export function MainSuggestion({
	suggestion,
	currentText,
	size,
	sizes,
	argument,
}: MainSuggestionProps) {
	const px = usePx();
	const options = useContext(OptionsContext);

	const [titleHeight, titleHeightMotion] = useMotion(0);
	const [badgeWidth, badgeWidthMotion] = useMotion(0);

	useEffect(() => {
		titleHeightMotion.spring(
			suggestion?.main.description !== undefined ? 1 : 0,
			springs.responsive,
		);
	}, [suggestion]);

	return (
		<Frame
			size={size}
			backgroundColor={options.palette.background}
			backgroundTransparency={options.backgroundTransparency}
			cornerRadius={new UDim(0, px(8))}
			clipsDescendants={false}
			event={{
				MouseEnter: () => options.setMouseOnGUI(true),
				MouseLeave: () => options.setMouseOnGUI(false),
			}}
		>
			<Padding all={new UDim(0, px(8))} />

			<Badge
				anchorPoint={new Vector2(1, 0)}
				size={badgeWidth.map((width) =>
					UDim2.fromOffset(math.round(width), px(24)),
				)}
				position={UDim2.fromScale(1, 0)}
				color={options.palette.highlight}
				text={
					argument && suggestion !== undefined
						? (suggestion.main as ArgumentSuggestion).dataType
						: ""
				}
				textColor={options.palette.surface}
				textSize={px(SUGGESTION_TEXT_SIZE)}
				visible={argument}
				onTextBoundsChange={(textBounds) =>
					badgeWidthMotion.spring(textBounds.X + px(8), {
						mass: 0.5,
						tension: 400,
					})
				}
			/>

			{showKeybindsGui({ options: options, suggestion: suggestion }) ? (
				<ShortcutGroup
					shortcuts={
						suggestion?.main.type === "command"
							? (suggestion?.main as CommandSuggestion).shortcuts
							: []
					}
				/>
			) : (
				<></>
			)}

			<Text
				size={sizes.map((val) => val.title)}
				position={lerpBinding(
					titleHeight,
					UDim2.fromOffset(0, 0),
					UDim2.fromOffset(0, px(-4)),
				)}
				text={
					argument
						? suggestion?.main.title
						: highlightMatching(
								options.palette.highlight,
								suggestion?.main.title,
								currentText,
							)
				}
				textSize={px(SUGGESTION_TITLE_TEXT_SIZE)}
				textColor={options.palette.text}
				textXAlignment="Left"
				textYAlignment="Top"
				richText={true}
				font={options.font.bold}
			/>

			<Text
				size={sizes.map((val) => val.description)}
				position={UDim2.fromOffset(0, px(SUGGESTION_TITLE_TEXT_SIZE))}
				text={suggestion?.main.description ?? ""}
				textSize={px(SUGGESTION_TEXT_SIZE)}
				textColor={options.palette.subtext}
				textXAlignment="Left"
				textYAlignment="Top"
				textWrapped={true}
				richText={true}
			/>

			<Text
				anchorPoint={new Vector2(0, 1)}
				size={sizes.map((val) => new UDim2(1, 0, 0, val.errorTextHeight))}
				position={UDim2.fromScale(0, 1)}
				text={
					argument && suggestion !== undefined
						? (suggestion.main as ArgumentSuggestion).error ?? ""
						: ""
				}
				textColor={options.palette.error}
				textSize={px(SUGGESTION_TEXT_SIZE)}
				textWrapped={true}
				textXAlignment="Left"
			/>
		</Frame>
	);
}
