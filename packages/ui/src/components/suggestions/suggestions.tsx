import { TextService } from "@rbxts/services";
import Vide, { cleanup, effect, source } from "@rbxts/vide";
import { springs } from "../../constants/springs";
import {
	SUGGESTION_TEXT_SIZE,
	SUGGESTION_TITLE_TEXT_SIZE,
} from "../../constants/text";
import { useAtom } from "../../hooks/use-atom";
import { useMotion } from "../../hooks/use-motion";
import { px } from "../../hooks/use-px";
import {
	currentSuggestion,
	currentTextPart,
	interfaceOptions,
} from "../../store";
import { Group } from "../ui/group";
import { MainSuggestion } from "./main-suggestion";
import { SuggestionList } from "./suggestion-list";
import { SuggestionTextBounds } from "./types";
import { getSuggestionTextBounds } from "./util";

const MAX_SUGGESTION_WIDTH = 180;
const MAX_BADGE_WIDTH = 80;
const PADDING = 8;

export function Suggestions() {
	const options = useAtom(interfaceOptions);
	const textPart = useAtom(currentTextPart);

	const textBoundsParams = new Instance("GetTextBoundsParams");
	textBoundsParams.RichText = true;
	cleanup(() => {
		textBoundsParams.Destroy();
	});

	// Suggestions
	const suggestion = useAtom(currentSuggestion);
	const sizes = source<SuggestionTextBounds>({
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
	effect(() => {
		const current = suggestion();
		if (current === undefined) {
			suggestionSizeMotion.spring(new UDim2());
			otherSuggestionSizeMotion.spring(new UDim2());
			return;
		}

		const otherSuggestions = current.others;
		if (otherSuggestions.isEmpty()) {
			otherSuggestionSizeMotion.spring(new UDim2());
		}

		const textBounds = getSuggestionTextBounds(
			options(),
			current,
			px(SUGGESTION_TITLE_TEXT_SIZE),
			px(SUGGESTION_TEXT_SIZE),
			px(MAX_SUGGESTION_WIDTH),
			px(MAX_BADGE_WIDTH),
		);

		sizes(textBounds);

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

			textBoundsParams.Font = options().font.regular;
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
	});

	return (
		<Group
			size={UDim2.fromScale(1, 1)}
			visible={currentSuggestion !== undefined}
		>
			<MainSuggestion
				suggestion={suggestion}
				currentText={textPart}
				size={suggestionSize}
				sizes={sizes}
			/>

			<SuggestionList
				suggestion={suggestion}
				currentText={textPart}
				size={otherSuggestionSize}
			/>

			<uilistlayout
				SortOrder="LayoutOrder"
				Padding={() => new UDim(0, px(PADDING))}
			/>
		</Group>
	);
}
