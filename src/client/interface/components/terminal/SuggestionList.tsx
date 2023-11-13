import { useSelector } from "@rbxts/react-reflex";
import Roact, { useContext, useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { slice } from "@rbxts/sift/out/Array";
import { CommandPath } from "../../../../shared";
import { Suggestion } from "../../../types";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { springs } from "../../constants/springs";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { DataContext } from "../../providers/dataProvider";
import { selectTerminalText } from "../../store/app";
import { toHex } from "../../util/color";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Padding } from "../interface/Padding";
import { Text } from "../interface/Text";

export interface SuggestionListProps {
	position?: UDim2;
}

const HIGHLIGHT_PREFIX = `<font color="${toHex(palette.blue)}">`;

function getHighlightedTitle(fieldText: string, suggestion?: Suggestion) {
	if (suggestion?.type !== "command") {
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
	const data = useContext(DataContext);

	const terminalText = useSelector(selectTerminalText);
	const suggestionPath = useMemo(() => {
		return new CommandPath(terminalText.parts);
	}, [terminalText]);

	// Suggestions
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const firstSuggestion = useMemo(() => (suggestions.size() > 0 ? suggestions[0] : undefined), [suggestions]);
	const otherSuggestions = useMemo(() => {
		if (suggestions.size() < 2) {
			return [];
		}
		return slice(suggestions, 2, math.max(suggestions.size(), 4));
	}, [suggestions]);

	// Suggestion size bindings
	const [textSizes, setTextSizes] = useState({
		title: UDim2.fromOffset(rem(16), rem(2)),
		description: UDim2.fromOffset(rem(16), rem(2)),
	});

	const [suggestionSize, suggestionSizeMotion] = useMotion(new UDim2());
	const [otherSuggestionSize, otherSuggestionSizeMotion] = useMotion(new UDim2());

	// Update suggestions when typing
	useEffect(() => {
		const pathSize = suggestionPath.getSize();
		if (pathSize === 0) {
			setSuggestions([]);
			return;
		}

		setSuggestions(data.getCommandSuggestions(suggestionPath));
	}, [suggestionPath]);

	// Resize window based on suggestions
	useEffect(() => {
		if (otherSuggestions.size() === 0) {
			otherSuggestionSizeMotion.spring(new UDim2());
		}

		if (firstSuggestion === undefined) {
			suggestionSizeMotion.spring(new UDim2());
			return;
		}

		const titleBounds = TextService.GetTextSize(
			firstSuggestion.title,
			rem(2),
			"GothamMedium",
			new Vector2(rem(16), math.huge),
		);

		const descriptionBounds =
			firstSuggestion.description !== undefined
				? TextService.GetTextSize(
						firstSuggestion.description,
						rem(1.5),
						"GothamMedium",
						new Vector2(rem(16), math.huge),
				  )
				: new Vector2();

		let windowWidth = math.max(titleBounds.X, descriptionBounds.X) + rem(1);
		let windowHeight = titleBounds.Y + descriptionBounds.Y + rem(2);

		// If the suggestion is an argument, calculate the data type text bounds
		// and add it to the size of the suggestion window
		if (firstSuggestion.type === "argument") {
			const dataTypeBounds = TextService.GetTextSize(
				firstSuggestion.dataType,
				rem(1),
				"GothamMedium",
				new Vector2(rem(8), rem(2)),
			);
			windowWidth += dataTypeBounds.X + rem(4);
			windowHeight += rem(1);
		}

		setTextSizes({
			title: UDim2.fromOffset(titleBounds.X, titleBounds.Y),
			description: UDim2.fromOffset(descriptionBounds.X, descriptionBounds.Y),
		});

		suggestionSizeMotion.spring(UDim2.fromOffset(windowWidth, windowHeight), springs.responsive);

		// Calculate other suggestion sizes
		if (otherSuggestions.size() > 0) {
			const otherHeight = otherSuggestions.size() * rem(2) + rem(1) + (otherSuggestions.size() - 1) * rem(0.5);
			otherSuggestionSizeMotion.spring(UDim2.fromOffset(windowWidth, otherHeight), springs.gentle);
		}
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

				{suggestions.size() > 0 && suggestions[0].type === "argument" && (
					<Group
						anchorPoint={new Vector2(1, 0)}
						size={UDim2.fromOffset(rem(6), rem(2))}
						position={UDim2.fromScale(1, 0)}
					>
						<Frame
							key="type-badge"
							size={new UDim2(1, 0, 0, rem(2))}
							backgroundColor={palette.surface0}
							cornerRadius={new UDim(1)}
						>
							<Padding key="padding" all={new UDim(0, rem(1))} />
							<Text
								key="text"
								text={suggestions[0].dataType}
								textColor={palette.white}
								textSize={rem(1)}
								size={UDim2.fromScale(1, 1)}
								font={fonts.inter.bold}
							/>
						</Frame>

						<Frame
							key="required-badge"
							size={new UDim2(1, 0, 0, rem(2))}
							position={UDim2.fromOffset(0, rem(2.5))}
							backgroundColor={suggestions[0].required ? palette.red : palette.blue}
							cornerRadius={new UDim(1)}
						>
							<Padding key="padding" all={new UDim(0, rem(1))} />
							<Text
								key="text"
								text={suggestions[0].required ? "Required" : "Optional"}
								textColor={palette.white}
								textSize={rem(1)}
								size={UDim2.fromScale(1, 1)}
								font={fonts.inter.bold}
							/>
						</Frame>
					</Group>
				)}

				<Text
					key="title"
					size={textSizes.title}
					text={getHighlightedTitle(terminalText.value, firstSuggestion)}
					textSize={rem(2)}
					textColor={palette.white}
					textXAlignment="Left"
					richText={true}
					font={fonts.inter.bold}
				/>

				<Text
					key="description"
					size={textSizes.description}
					position={UDim2.fromOffset(0, rem(2))}
					text={firstSuggestion?.description}
					textSize={rem(1.5)}
					textColor={palette.white}
					textXAlignment="Left"
					textWrapped={true}
					richText={true}
				/>
			</Frame>

			<Group key="other" size={otherSuggestionSize}>
				<uilistlayout key="layout" SortOrder="LayoutOrder" Padding={new UDim(0, rem(0.5))} />

				{otherSuggestions?.map((suggestion) => {
					return (
						<Frame
							size={new UDim2(1, 0, 0, rem(2))}
							backgroundColor={palette.mantle}
							cornerRadius={new UDim(0, rem(0.5))}
						>
							<Padding all={new UDim(0, rem(0.5))} />

							<Text
								size={new UDim2(1, 0, 1, 0)}
								text={getHighlightedTitle(terminalText.value, suggestion)}
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
