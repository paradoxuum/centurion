import { getBindingValue } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, { useBinding, useEffect, useMemo } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { slice } from "@rbxts/sift/out/Array";
import { ArgumentSuggestion, Suggestion } from "../../../../types";
import { DEFAULT_FONT, fonts } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { springs } from "../../../constants/springs";
import { useMotion } from "../../../hooks/useMotion";
import { useRem } from "../../../hooks/useRem";
import { selectSuggestions, selectText } from "../../../store/app";
import { toHex } from "../../../util/color";
import { Frame } from "../../interface/Frame";
import { Group } from "../../interface/Group";
import { Padding } from "../../interface/Padding";
import { Text } from "../../interface/Text";
import { Badge } from "./Badge";

export interface SuggestionListProps {
	position?: UDim2;
}

const HIGHLIGHT_PREFIX = `<font color="${toHex(palette.blue)}">`;

function getHighlightedTitle(fieldText?: string, suggestion?: Suggestion) {
	if (suggestion?.type !== "command" || fieldText === undefined) {
		return suggestion?.title;
	}

	const formattedText = suggestion.title.sub(0, fieldText.size());
	if (fieldText !== formattedText) {
		return suggestion.title;
	}

	return HIGHLIGHT_PREFIX + formattedText + "</font>" + suggestion.title.sub(fieldText.size() + 1);
}

export function SuggestionList({ position }: SuggestionListProps) {
	const rem = useRem();

	const terminalText = useSelector(selectText);
	const currentTextPart = useMemo(() => {
		if (terminalText.index === -1 || terminalText.index >= terminalText.parts.size()) {
			return;
		}
		return terminalText.parts[terminalText.index];
	}, [terminalText]);

	const textBoundsParams = useMemo(() => new Instance("GetTextBoundsParams"), []);

	// Suggestions
	const suggestions = useSelector(selectSuggestions);
	const firstSuggestion = useMemo(() => (suggestions.size() > 0 ? suggestions[0] : undefined), [suggestions]);
	const otherSuggestions = useMemo(() => {
		if (suggestions.size() < 2) {
			return [];
		}
		return slice(suggestions, 2, math.max(suggestions.size(), 4));
	}, [suggestions]);
	const isArgument = useMemo(() => {
		return firstSuggestion?.type === "argument";
	}, [firstSuggestion]);

	// Suggestion size bindings
	const [sizes, setSizes] = useBinding({
		titleText: UDim2.fromOffset(rem(16), rem(2)),
		descriptionText: UDim2.fromOffset(rem(16), rem(2)),
		typeBadgeWidth: rem(6),
	});

	const [suggestionSize, suggestionSizeMotion] = useMotion(new UDim2());
	const [otherSuggestionSize, otherSuggestionSizeMotion] = useMotion(new UDim2());

	// Resize window based on suggestions
	useEffect(() => {
		if (otherSuggestions.size() === 0) {
			otherSuggestionSizeMotion.spring(new UDim2());
		}

		if (firstSuggestion === undefined) {
			suggestionSizeMotion.spring(new UDim2());
			return;
		}

		textBoundsParams.Text = firstSuggestion.title;
		textBoundsParams.Font = fonts.inter.bold;
		textBoundsParams.Size = rem(2);
		textBoundsParams.Width = rem(16);

		const titleBounds = TextService.GetTextBoundsAsync(textBoundsParams);

		let descriptionBounds: Vector2;
		if (firstSuggestion.description !== undefined) {
			textBoundsParams.Text = firstSuggestion.description;
			textBoundsParams.Font = DEFAULT_FONT;
			textBoundsParams.Size = rem(1.5);
			descriptionBounds = TextService.GetTextBoundsAsync(textBoundsParams);
		} else {
			descriptionBounds = new Vector2();
		}

		let windowWidth = math.max(titleBounds.X, descriptionBounds.X) + rem(2);
		let windowHeight = titleBounds.Y + descriptionBounds.Y + rem(2);

		// If the suggestion is an argument, calculate the data type text bounds
		// and add it to the size of the suggestion window
		let typeBadgeBounds: Vector2 | undefined;
		if (firstSuggestion.type === "argument") {
			textBoundsParams.Text = firstSuggestion.dataType;
			textBoundsParams.Font = DEFAULT_FONT;
			textBoundsParams.Size = rem(1.5);
			textBoundsParams.Width = rem(8);

			typeBadgeBounds = TextService.GetTextBoundsAsync(textBoundsParams);
			windowWidth += typeBadgeBounds.X + rem(4);
			windowHeight += rem(1);
		}

		setSizes({
			titleText: UDim2.fromOffset(titleBounds.X, titleBounds.Y),
			descriptionText: UDim2.fromOffset(descriptionBounds.X, descriptionBounds.Y),
			typeBadgeWidth:
				typeBadgeBounds !== undefined ? typeBadgeBounds.X + rem(2) : getBindingValue(sizes).typeBadgeWidth,
		});

		// Calculate other suggestion sizes
		if (otherSuggestions.size() > 0) {
			let maxSuggestionWidth = 0;

			textBoundsParams.Font = DEFAULT_FONT;
			textBoundsParams.Size = rem(1.6);
			textBoundsParams.Width = math.huge;

			for (const suggestion of otherSuggestions) {
				textBoundsParams.Text = suggestion.title;
				const suggestionBounds = TextService.GetTextBoundsAsync(textBoundsParams);
				if (suggestionBounds.X > maxSuggestionWidth) {
					maxSuggestionWidth = suggestionBounds.X;
				}
			}

			const otherHeight = otherSuggestions.size() * rem(2) + rem(1) + (otherSuggestions.size() - 1) * rem(0.5);
			windowWidth = math.max(windowWidth, maxSuggestionWidth);
			otherSuggestionSizeMotion.spring(UDim2.fromOffset(windowWidth, otherHeight), springs.gentle);
		}

		suggestionSizeMotion.spring(UDim2.fromOffset(windowWidth, windowHeight), springs.responsive);
	}, [suggestions, rem]);

	return (
		<Group
			size={new UDim2(1, 0, 0, rem(16))}
			position={position}
			clipsDescendants={true}
			visible={suggestions.size() > 0}
		>
			<Frame
				key="top"
				size={suggestionSize}
				backgroundColor={palette.crust}
				cornerRadius={new UDim(0, rem(0.5))}
				clipsDescendants={true}
			>
				<Padding key="padding" all={new UDim(0, rem(1))} />

				<Group
					key="badges"
					anchorPoint={new Vector2(1, 0)}
					size={sizes.map((val) => UDim2.fromOffset(math.max(val.typeBadgeWidth, rem(7)), rem(4.5)))}
					position={UDim2.fromScale(1, 0)}
					visible={isArgument}
				>
					<Badge
						key="optional-badge"
						size={new UDim2(1, 0, 0, rem(2))}
						color={
							isArgument && (firstSuggestion as ArgumentSuggestion).optional ? palette.blue : palette.red
						}
						text={isArgument && (firstSuggestion as ArgumentSuggestion).optional ? "Optional" : "Required"}
						textColor={palette.white}
						textSize={rem(1.5)}
					/>

					<Badge
						key="type-badge"
						size={new UDim2(1, 0, 0, rem(2))}
						position={UDim2.fromOffset(0, rem(2.5))}
						color={palette.surface0}
						text={isArgument ? (firstSuggestion as ArgumentSuggestion).dataType : ""}
						textColor={palette.white}
						textSize={rem(1.5)}
					/>
				</Group>

				<Text
					key="title"
					size={sizes.map((val) => val.titleText)}
					text={getHighlightedTitle(currentTextPart, firstSuggestion)}
					textSize={rem(2)}
					textColor={palette.white}
					textXAlignment="Left"
					richText={true}
					font={fonts.inter.bold}
				/>

				<Text
					key="description"
					size={sizes.map((val) => val.descriptionText)}
					position={UDim2.fromOffset(0, rem(2))}
					text={firstSuggestion?.description ?? ""}
					textSize={rem(1.5)}
					textColor={palette.white}
					textXAlignment="Left"
					textWrapped={true}
					richText={true}
				/>
			</Frame>

			<Group key="other" size={otherSuggestionSize}>
				<uilistlayout key="layout" SortOrder="LayoutOrder" Padding={new UDim(0, rem(0.5))} />

				{otherSuggestions?.map((suggestion, i) => {
					return (
						<Frame
							key={suggestion.title}
							size={new UDim2(1, 0, 0, rem(2))}
							backgroundColor={palette.mantle}
							cornerRadius={new UDim(0, rem(0.5))}
							clipsDescendants={true}
						>
							<Padding key="padding" all={new UDim(0, rem(0.5))} />

							<Text
								key="text"
								size={new UDim2(1, 0, 1, 0)}
								text={getHighlightedTitle(currentTextPart, suggestion)}
								textColor={palette.white}
								textSize={rem(1.6)}
								textXAlignment="Left"
								richText={true}
							/>
						</Frame>
					);
				})}
			</Group>

			<uilistlayout key="layout" SortOrder="LayoutOrder" Padding={new UDim(0, rem(0.5))} />
		</Group>
	);
}
