import { useSelector } from "@rbxts/react-reflex";
import Roact, {
	useBinding,
	useContext,
	useEffect,
	useMemo,
} from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { springs } from "../../../constants/springs";
import {
	SUGGESTION_TEXT_SIZE,
	SUGGESTION_TITLE_TEXT_SIZE,
} from "../../../constants/text";
import { useMotion } from "../../../hooks/useMotion";
import { usePx } from "../../../hooks/usePx";
import { OptionsContext } from "../../../providers/optionsProvider";
import { selectCurrentSuggestion } from "../../../store/suggestion";
import { selectText } from "../../../store/text";
import { Group } from "../../interface/Group";
import { MainSuggestion } from "./MainSuggestion";
import { SuggestionList } from "./SuggestionList";
import { SuggestionTextBounds } from "./types";
import { getSuggestionTextBounds } from "./util";

const MAX_SUGGESTION_WIDTH = 180;
const MAX_BADGE_WIDTH = 80;
const PADDING = 8;

export function Suggestions() {
	const options = useContext(OptionsContext);
	const px = usePx();

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
		title: UDim2.fromOffset(0, px(SUGGESTION_TITLE_TEXT_SIZE)),
		description: UDim2.fromOffset(0, px(SUGGESTION_TEXT_SIZE)),
		errorTextHeight: 0,
		typeBadgeWidth: 0,
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
			options,
			mainSuggestion,
			px(SUGGESTION_TITLE_TEXT_SIZE),
			px(SUGGESTION_TEXT_SIZE),
			px(MAX_SUGGESTION_WIDTH),
			px(MAX_BADGE_WIDTH),
		);

		setSizes(textBounds);

		print(textBounds.typeBadgeWidth);
		let windowWidth =
			math.max(textBounds.title.X.Offset, textBounds.description.X.Offset) +
			px(PADDING * 2);

		let windowHeight =
			textBounds.title.Y.Offset +
			textBounds.description.Y.Offset +
			textBounds.errorTextHeight +
			px(PADDING * 2);

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

			textBoundsParams.Font = options.font.regular;
			textBoundsParams.Size = px(SUGGESTION_TEXT_SIZE);
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
				otherSuggestions.size() * px(SUGGESTION_TEXT_SIZE + 6) +
				(otherSuggestions.size() - 1) * px(4) +
				px(8);
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
			size={UDim2.fromScale(1, 1)}
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

			<SuggestionList
				key="other"
				suggestion={currentSuggestion}
				currentText={currentTextPart}
				size={otherSuggestionSize}
			/>

			<uilistlayout
				key="layout"
				SortOrder="LayoutOrder"
				Padding={new UDim(0, px(PADDING))}
			/>
		</Group>
	);
}
