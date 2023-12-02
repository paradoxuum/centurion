import { getBindingValue } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, {
	useBinding,
	useContext,
	useEffect,
	useMemo,
} from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { DEFAULT_FONT, fonts } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { springs } from "../../../constants/springs";
import { useMotion } from "../../../hooks/useMotion";
import { useRem } from "../../../hooks/useRem";
import { SuggestionContext } from "../../../providers/suggestionProvider";
import { selectText } from "../../../store/app";
import { ArgumentSuggestion } from "../../../types";
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

function highlight(text?: string, terminalText?: string) {
	if (text === undefined) return "";
	if (terminalText === undefined) return text;

	const subText = text.sub(0, terminalText.size());
	if (terminalText.lower() !== subText.lower()) {
		return text;
	}

	const unhighlightedText = text.sub(terminalText.size() + 1);
	return `${HIGHLIGHT_PREFIX}${subText}</font>${unhighlightedText}`;
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
	const suggestion = useContext(SuggestionContext).suggestion;
	const isArgument = useMemo(
		() => suggestion?.main.type === "argument",
		[suggestion],
	);

	const [sizes, setSizes] = useBinding({
		titleText: UDim2.fromOffset(rem(16), rem(2)),
		descriptionText: UDim2.fromOffset(rem(16), rem(2)),
		typeBadgeWidth: rem(6),
	});

	const [suggestionSize, suggestionSizeMotion] = useMotion(new UDim2());
	const [otherSuggestionSize, otherSuggestionSizeMotion] = useMotion(
		new UDim2(),
	);

	// Resize window based on suggestions
	useEffect(() => {
		if (suggestion === undefined) {
			suggestionSizeMotion.spring(new UDim2());
			otherSuggestionSizeMotion.spring(new UDim2());
			return;
		}

		const mainSuggestion = suggestion.main;
		const otherSuggestions = suggestion.others;
		if (otherSuggestions.isEmpty()) {
			otherSuggestionSizeMotion.spring(new UDim2());
		}

		textBoundsParams.Text = mainSuggestion.title;
		textBoundsParams.Font = fonts.inter.bold;
		textBoundsParams.Size = rem(2);
		textBoundsParams.Width = rem(16);

		const titleBounds = TextService.GetTextBoundsAsync(textBoundsParams);

		let descriptionBounds: Vector2;
		if (mainSuggestion.description !== undefined) {
			textBoundsParams.Text = mainSuggestion.description;
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
		if (mainSuggestion.type === "argument") {
			textBoundsParams.Text = mainSuggestion.dataType;
			textBoundsParams.Font = DEFAULT_FONT;
			textBoundsParams.Size = rem(1.5);
			textBoundsParams.Width = rem(8);

			typeBadgeBounds = TextService.GetTextBoundsAsync(textBoundsParams);
			windowWidth += typeBadgeBounds.X + rem(4);
			windowHeight += rem(1);
		}

		setSizes({
			titleText: UDim2.fromOffset(titleBounds.X, titleBounds.Y),
			descriptionText: UDim2.fromOffset(
				descriptionBounds.X,
				descriptionBounds.Y,
			),
			typeBadgeWidth:
				typeBadgeBounds !== undefined
					? typeBadgeBounds.X + rem(2)
					: getBindingValue(sizes).typeBadgeWidth,
		});

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
	}, [suggestion, rem]);

	return (
		<Group
			size={new UDim2(1, 0, 0, rem(16))}
			position={position}
			clipsDescendants={true}
			visible={suggestion !== undefined}
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
					size={sizes.map((val) =>
						UDim2.fromOffset(math.max(val.typeBadgeWidth, rem(7)), rem(4.5)),
					)}
					position={UDim2.fromScale(1, 0)}
					visible={isArgument}
				>
					<Badge
						key="optional-badge"
						size={new UDim2(1, 0, 0, rem(2))}
						color={
							isArgument &&
							suggestion !== undefined &&
							(suggestion.main as ArgumentSuggestion).optional
								? palette.blue
								: palette.red
						}
						text={
							isArgument &&
							suggestion !== undefined &&
							(suggestion.main as ArgumentSuggestion).optional
								? "Optional"
								: "Required"
						}
						textColor={palette.white}
						textSize={rem(1.5)}
					/>

					<Badge
						key="type-badge"
						size={new UDim2(1, 0, 0, rem(2))}
						position={UDim2.fromOffset(0, rem(2.5))}
						color={palette.surface0}
						text={
							isArgument && suggestion !== undefined
								? (suggestion.main as ArgumentSuggestion).dataType
								: ""
						}
						textColor={palette.white}
						textSize={rem(1.5)}
					/>
				</Group>

				<Text
					key="title"
					size={sizes.map((val) => val.titleText)}
					text={
						isArgument
							? suggestion?.main.title
							: highlight(suggestion?.main.title, currentTextPart)
					}
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
					text={suggestion?.main.description ?? ""}
					textSize={rem(1.5)}
					textColor={palette.white}
					textXAlignment="Left"
					textWrapped={true}
					richText={true}
				/>
			</Frame>

			<Group key="other" size={otherSuggestionSize}>
				<uilistlayout
					key="layout"
					SortOrder="LayoutOrder"
					Padding={new UDim(0, rem(0.5))}
				/>

				{suggestion?.others?.map((name, i) => {
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
								text={highlight(name, currentTextPart)}
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
