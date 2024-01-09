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
import { Frame } from "../../interface/Frame";
import { Group } from "../../interface/Group";
import { Padding } from "../../interface/Padding";
import { Text } from "../../interface/Text";
import { MainSuggestion } from "./MainSuggestion";
import { SuggestionSizes } from "./types";
import { highlightMatching } from "./util";

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
	const suggestion = useContext(SuggestionContext).suggestion;
	const [sizes, setSizes] = useBinding<SuggestionSizes>({
		title: UDim2.fromOffset(rem(16), rem(2)),
		description: UDim2.fromOffset(rem(16), rem(2)),
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
			title: UDim2.fromOffset(titleBounds.X, titleBounds.Y),
			description: UDim2.fromOffset(descriptionBounds.X, descriptionBounds.Y),
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
			<MainSuggestion
				key="main"
				suggestion={suggestion}
				argument={suggestion?.main.type === "argument"}
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
