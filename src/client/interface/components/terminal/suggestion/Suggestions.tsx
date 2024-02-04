import { useSelector } from "@rbxts/react-reflex";
import Roact, { useBinding, useEffect, useMemo } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { DEFAULT_FONT } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { springs } from "../../../constants/springs";
import { useMotion } from "../../../hooks/useMotion";
import { useRem } from "../../../hooks/useRem";
import { selectCurrentSuggestion } from "../../../store/suggestion";
import { selectText } from "../../../store/text";
import { Frame } from "../../interface/Frame";
import { Group } from "../../interface/Group";
import { Padding } from "../../interface/Padding";
import { Text } from "../../interface/Text";
import { MainSuggestion } from "./MainSuggestion";
import { SuggestionTextBounds } from "./types";
import { getSuggestionTextBounds, highlightMatching } from "./util";

export interface SuggestionListProps {
	position?: UDim2;
}

export function SuggestionList({ position }: SuggestionListProps) {
	const rem = useRem();

	const terminalText = useSelector(selectText);
	const currentTextPart = useMemo(() => {
		if (
			terminalText.index === -1 ||
			terminalText.index >= terminalText.parts.size()
		) {
			return;
		}
		return terminalText.parts[terminalText.index];
	}, [terminalText]);

	const textBoundsParams = useMemo(
		() => new Instance("GetTextBoundsParams"),
		[],
	);

	// Suggestions
	const currentSuggestion = useSelector(selectCurrentSuggestion);
	const [sizes, setSizes] = useBinding<SuggestionTextBounds>({
		title: UDim2.fromOffset(rem(16), rem(2)),
		description: UDim2.fromOffset(rem(16), rem(2)),
		errorTextHeight: 0,
		typeBadgeWidth: rem(6),
	});

	const [suggestionSize, suggestionSizeMotion] = useMotion(new UDim2());
	const [otherSuggestionSize, otherSuggestionSizeMotion] = useMotion(
		new UDim2(),
	);

	// Resize window based on suggestions
	useEffect(() => {
		if (currentSuggestion === undefined) {
			suggestionSizeMotion.spring(new UDim2());
			otherSuggestionSizeMotion.spring(new UDim2());
			return;
		}

		const mainSuggestion = currentSuggestion.main;
		const otherSuggestions = currentSuggestion.others;
		if (otherSuggestions.isEmpty()) {
			otherSuggestionSizeMotion.spring(new UDim2());
		}

		const textBounds = getSuggestionTextBounds(
			mainSuggestion,
			rem(2),
			rem(1.5),
			rem(16),
			rem(8),
		);

		setSizes(textBounds);

		let windowWidth =
			math.max(textBounds.title.X.Offset, textBounds.description.X.Offset) +
			textBounds.typeBadgeWidth +
			rem(6);

		let windowHeight =
			textBounds.title.Y.Offset +
			textBounds.description.Y.Offset +
			textBounds.errorTextHeight +
			rem(2);

		if (textBounds.typeBadgeWidth > 0) {
			windowHeight += rem(1);
			windowWidth += rem(0.5);
		}

		if (textBounds.errorTextHeight > 0) {
			windowHeight += rem(0.5);
		}

		// Calculate other suggestion sizes
		if (!otherSuggestions.isEmpty()) {
			let maxSuggestionWidth = 0;

			textBoundsParams.Font = DEFAULT_FONT;
			textBoundsParams.Size = rem(1.6);
			textBoundsParams.Width = math.huge;

			for (const name of otherSuggestions) {
				textBoundsParams.Text = name;
				const suggestionBounds =
					TextService.GetTextBoundsAsync(textBoundsParams);
				if (suggestionBounds.X > maxSuggestionWidth) {
					maxSuggestionWidth = suggestionBounds.X;
				}
			}

			const otherHeight =
				otherSuggestions.size() * rem(2) +
				rem(1) +
				(otherSuggestions.size() - 1) * rem(0.5);
			windowWidth = math.max(windowWidth, maxSuggestionWidth);
			otherSuggestionSizeMotion.spring(
				UDim2.fromOffset(windowWidth, otherHeight),
				springs.gentle,
			);
		}

		suggestionSizeMotion.spring(
			UDim2.fromOffset(windowWidth, windowHeight),
			springs.responsive,
		);
	}, [currentSuggestion, rem]);

	return (
		<Group
			size={new UDim2(1, 0, 0, rem(16))}
			position={position}
			clipsDescendants={true}
			visible={currentSuggestion !== undefined}
		>
			<MainSuggestion
				key="main"
				suggestion={currentSuggestion}
				argument={currentSuggestion?.main.type === "argument"}
				currentText={currentTextPart}
				size={suggestionSize}
				sizes={sizes}
			/>

			<Group key="other" size={otherSuggestionSize}>
				<uilistlayout
					key="layout"
					SortOrder="LayoutOrder"
					Padding={new UDim(0, rem(0.5))}
				/>

				{currentSuggestion?.others?.map((name, i) => {
					return (
						<Frame
							key={`${i}-${name}`}
							size={new UDim2(1, 0, 0, rem(2))}
							backgroundColor={palette.mantle}
							cornerRadius={new UDim(0, rem(0.5))}
							clipsDescendants={true}
						>
							<Padding key="padding" all={new UDim(0, rem(0.5))} />

							<Text
								key="text"
								size={new UDim2(1, 0, 1, 0)}
								text={highlightMatching(name, currentTextPart)}
								textColor={palette.white}
								textSize={rem(1.6)}
								textXAlignment="Left"
								richText={true}
							/>
						</Frame>
					);
				})}
			</Group>

			<uilistlayout
				key="layout"
				SortOrder="LayoutOrder"
				Padding={new UDim(0, rem(0.5))}
			/>
		</Group>
	);
}
