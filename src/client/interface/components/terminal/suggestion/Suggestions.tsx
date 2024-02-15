import { useSelector } from "@rbxts/react-reflex";
import Roact, {
	useBinding,
	useContext,
	useEffect,
	useMemo,
} from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { DEFAULT_FONT } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { springs } from "../../../constants/springs";
import { useMotion } from "../../../hooks/useMotion";
import { usePx } from "../../../hooks/usePx";
import { OptionsContext } from "../../../providers/optionsProvider";
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
	const px = usePx();
	const options = useContext(OptionsContext);

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
		title: UDim2.fromOffset(px(256), px(32)),
		description: UDim2.fromOffset(px(256), px(32)),
		errorTextHeight: 0,
		typeBadgeWidth: px(96),
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
			px(32),
			px(24),
			px(256),
			px(128),
		);

		setSizes(textBounds);

		let windowWidth =
			math.max(textBounds.title.X.Offset, textBounds.description.X.Offset) +
			textBounds.typeBadgeWidth +
			px(32);

		let windowHeight =
			textBounds.title.Y.Offset +
			textBounds.description.Y.Offset +
			textBounds.errorTextHeight +
			px(32);

		if (textBounds.typeBadgeWidth > 0) {
			windowWidth += textBounds.typeBadgeWidth + px(16);
		}

		if (textBounds.errorTextHeight > 0) {
			windowHeight += px(8);
		}

		// Calculate other suggestion sizes
		let otherHeight = 0;
		if (!otherSuggestions.isEmpty()) {
			let maxSuggestionWidth = 0;

			textBoundsParams.Font = DEFAULT_FONT;
			textBoundsParams.Size = px(26);
			textBoundsParams.Width = math.huge;

			for (const name of otherSuggestions) {
				textBoundsParams.Text = name;
				const suggestionBounds =
					TextService.GetTextBoundsAsync(textBoundsParams);
				if (suggestionBounds.X > maxSuggestionWidth) {
					maxSuggestionWidth = suggestionBounds.X;
				}
			}

			otherHeight =
				otherSuggestions.size() * px(32) +
				(otherSuggestions.size() - 1) * px(8) +
				px(16);
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
	}, [currentSuggestion, px]);

	return (
		<Group
			size={new UDim2(1, 0, 0, px(288))}
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

			<Group
				key="other"
				size={otherSuggestionSize}
				event={{
					MouseEnter: () => options.setMouseOnGUI(true),
					MouseLeave: () => options.setMouseOnGUI(false),
				}}
			>
				<uilistlayout
					key="layout"
					SortOrder="LayoutOrder"
					Padding={new UDim(0, px(8))}
				/>

				{currentSuggestion?.others?.map((name, i) => {
					return (
						<Frame
							key={`${i}-${name}`}
							size={new UDim2(1, 0, 0, px(32))}
							backgroundColor={palette.mantle}
							cornerRadius={new UDim(0, px(8))}
							clipsDescendants={true}
						>
							<Padding key="padding" all={new UDim(0, px(8))} />

							<Text
								key="text"
								size={new UDim2(1, 0, 1, 0)}
								text={highlightMatching(name, currentTextPart)}
								textColor={palette.text}
								textSize={px(26)}
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
				Padding={new UDim(0, px(8))}
			/>
		</Group>
	);
}
