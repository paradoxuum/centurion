import Vide, { Derivable, effect, read } from "@rbxts/vide";
import { springs } from "../../constants/springs";
import {
	SUGGESTION_TEXT_SIZE,
	SUGGESTION_TITLE_TEXT_SIZE,
} from "../../constants/text";
import { useAtom } from "../../hooks/use-atom";
import { useMotion } from "../../hooks/use-motion";
import { px } from "../../hooks/use-px";
import { interfaceOptions, mouseOverInterface } from "../../store";
import { Suggestion } from "../../types";
import { Frame } from "../ui/frame";
import { Padding } from "../ui/padding";
import { Text } from "../ui/text";
import { Badge } from "./badge";
import { SuggestionTextBounds } from "./types";
import { highlightMatching } from "./util";

export interface MainSuggestionProps {
	suggestion: Derivable<Suggestion | undefined>;
	currentText?: Derivable<string | undefined>;
	size: Derivable<UDim2>;
	sizes: Derivable<SuggestionTextBounds>;
}

export function MainSuggestion({
	suggestion,
	currentText,
	size,
	sizes,
}: MainSuggestionProps) {
	const options = useAtom(interfaceOptions);

	const [titleHeight, titleHeightMotion] = useMotion(0);
	const [badgeWidth, badgeWidthMotion] = useMotion(0);

	effect(() => {
		titleHeightMotion.spring(
			read(suggestion)?.description !== undefined ? 1 : 0,
			springs.responsive,
		);
	});

	return (
		<Frame
			size={size}
			backgroundColor={() => options().palette.background}
			backgroundTransparency={() => options().backgroundTransparency ?? 0}
			cornerRadius={new UDim(0, px(8))}
			clipsDescendants={false}
			mouseEnter={() => mouseOverInterface(true)}
			mouseLeave={() => mouseOverInterface(false)}
		>
			<Padding all={new UDim(0, px(8))} />

			<Badge
				anchorPoint={new Vector2(1, 0)}
				size={() => {
					return UDim2.fromOffset(badgeWidth(), px(24));
				}}
				position={UDim2.fromScale(1, 0)}
				color={() => options().palette.highlight}
				text={() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion !== undefined &&
						currentSuggestion.type === "argument"
						? currentSuggestion.dataType
						: "";
				}}
				textColor={() => options().palette.surface}
				textSize={px(SUGGESTION_TEXT_SIZE)}
				visible={() => {
					const currentSuggestion = read(suggestion);
					return (
						currentSuggestion !== undefined &&
						currentSuggestion.type === "argument"
					);
				}}
				onTextBoundsChange={(textBounds) =>
					badgeWidthMotion.spring(textBounds.X + px(8), {
						mass: 0.5,
						tension: 400,
					})
				}
			/>

			<Text
				size={() => read(sizes).title}
				position={() => {
					return UDim2.fromOffset(0, 0).Lerp(
						UDim2.fromOffset(0, px(-4)),
						titleHeight(),
					);
				}}
				text={() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion?.type === "argument"
						? currentSuggestion.title
						: highlightMatching(
								options().palette.highlight,
								currentSuggestion?.title,
								read(currentText),
							);
				}}
				textSize={px(SUGGESTION_TITLE_TEXT_SIZE)}
				textColor={() => options().palette.text}
				textXAlignment="Left"
				textYAlignment="Top"
				richText={true}
				font={() => options().font.bold}
			/>

			<Text
				size={() => read(sizes).description}
				position={UDim2.fromOffset(0, px(SUGGESTION_TITLE_TEXT_SIZE))}
				text={() => read(suggestion)?.description ?? ""}
				textSize={px(SUGGESTION_TEXT_SIZE)}
				textColor={() => options().palette.subtext}
				textXAlignment="Left"
				textYAlignment="Top"
				textWrapped={true}
				richText={true}
			/>

			<Text
				anchorPoint={new Vector2(0, 1)}
				size={() => new UDim2(1, 0, 0, read(sizes).errorTextHeight)}
				position={UDim2.fromScale(0, 1)}
				text={() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion !== undefined &&
						currentSuggestion.type === "argument"
						? currentSuggestion.error ?? ""
						: "";
				}}
				textColor={() => options().palette.error}
				textSize={px(SUGGESTION_TEXT_SIZE)}
				textWrapped={true}
				textXAlignment="Left"
			/>
		</Frame>
	);
}
