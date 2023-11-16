import { useSelector } from "@rbxts/react-reflex";
import Roact, { useContext, useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { slice } from "@rbxts/sift/out/Array";
import { ImmutableCommandPath } from "../../../../../shared";
import { Suggestion } from "../../../../types";
import { fonts } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { springs } from "../../../constants/springs";
import { useMotion } from "../../../hooks/useMotion";
import { useRem } from "../../../hooks/useRem";
import { useStore } from "../../../hooks/useStore";
import { DataContext } from "../../../providers/dataProvider";
import { selectTerminalText } from "../../../store/app";
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
	const data = useContext(DataContext);
	const store = useStore();

	const terminalText = useSelector(selectTerminalText);
	const currentTextPart = useMemo(() => {
		if (terminalText.index === -1 || terminalText.index >= terminalText.parts.size()) {
			return;
		}
		return terminalText.parts[terminalText.index];
	}, [terminalText]);

	// Update suggestions when typing
	useEffect(() => {
		if (terminalText.index === -1) {
			setSuggestions([]);
			store.setSuggestionText("");
			return;
		}

		const parentPath = new ImmutableCommandPath(slice(terminalText.parts, 1, terminalText.index));
		const partCount = terminalText.parts.size();
		const suggestions = data.getCommandSuggestions(
			terminalText.index < partCount ? currentTextPart : undefined,
			terminalText.index > 0 ? parentPath : undefined,
		);

		setSuggestions(suggestions);

		if (suggestions.isEmpty()) {
			store.setSuggestionText("");
			return;
		}

		const startIndex = terminalText.index < partCount && currentTextPart !== undefined ? currentTextPart.size() : 0;
		store.setSuggestionText(terminalText.value + suggestions[0].title.sub(startIndex + 1));
	}, [currentTextPart]);

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

		let windowWidth = math.max(titleBounds.X, descriptionBounds.X) + rem(2);
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

		// Calculate other suggestion sizes
		if (otherSuggestions.size() > 0) {
			let maxSuggestionWidth = 0;
			for (const suggestion of otherSuggestions) {
				const suggestionBounds = TextService.GetTextSize(
					suggestion.title,
					rem(1.6),
					"GothamMedium",
					new Vector2(math.huge, math.huge),
				);

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

				{suggestions.size() > 0 && suggestions[0].type === "argument" && (
					<Group
						key="argument-badges"
						anchorPoint={new Vector2(1, 0)}
						size={UDim2.fromOffset(rem(6), rem(2))}
						position={UDim2.fromScale(1, 0)}
					>
						<Badge
							key="type"
							size={new UDim2(1, 0, 0, rem(2))}
							color={palette.surface0}
							text={suggestions[0].dataType}
						/>

						<Badge
							key="required"
							size={new UDim2(1, 0, 0, rem(2))}
							color={suggestions[0].optional ? palette.blue : palette.red}
							text={suggestions[0].optional ? "Optional" : "Required"}
						/>
					</Group>
				)}

				<Text
					key="title"
					size={textSizes.title}
					text={getHighlightedTitle(currentTextPart, firstSuggestion)}
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
