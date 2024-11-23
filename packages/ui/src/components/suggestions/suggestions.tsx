import { TextService } from "@rbxts/services";
import Vide, { cleanup, derive, source, spring, read } from "@rbxts/vide";
import {
	SUGGESTION_TEXT_SIZE,
	SUGGESTION_TITLE_TEXT_SIZE,
} from "../../constants/text";
import { px } from "../../hooks/use-px";
import { useTextBounds } from "../../hooks/use-text-bounds";
import { currentSuggestion, currentTextPart, options } from "../../store";
import { Group } from "../ui/group";
import { MainSuggestion } from "./main-suggestion";
import { SuggestionList } from "./suggestion-list";

const MAX_SUGGESTION_WIDTH = 180;
const PADDING = 8;

export function Suggestions() {
	const suggestionRef = source<Frame>();

	const offset = (boundsState: () => Vector2) => () => {
		const bounds = boundsState();
		return new UDim2(0, bounds.X, 0, bounds.Y);
	};

	const titleBounds = useTextBounds({
		text: () => currentSuggestion()?.title,
		font: () => read(options().font).bold,
		size: () => px(SUGGESTION_TITLE_TEXT_SIZE),
	});

	const descriptionBounds = useTextBounds({
		text: () => currentSuggestion()?.description,
		font: () => read(options().font).regular,
		size: () => px(SUGGESTION_TEXT_SIZE),
		width: () => px(MAX_SUGGESTION_WIDTH),
	});

	const typeBadgeBounds = useTextBounds({
		text: () => {
			const suggestion = currentSuggestion();
			if (suggestion?.type === "command") return;
			return suggestion?.dataType;
		},
		font: () => read(options().font).bold,
		size: () => px(SUGGESTION_TEXT_SIZE),
	});

	const errorBounds = useTextBounds({
		text: () => {
			const suggestion = currentSuggestion();
			if (suggestion?.type === "command") return;
			return suggestion?.error;
		},
		font: () => read(options().font).regular,
		size: () => px(SUGGESTION_TEXT_SIZE),
	});

	const listBoundsParams = new Instance("GetTextBoundsParams");
	listBoundsParams.RichText = true;
	cleanup(listBoundsParams);

	const listBounds = derive(() => {
		let width = 0;

		const suggestions = currentSuggestion()?.others ?? [];
		for (const value of suggestions) {
			listBoundsParams.Text = value;
			const suggestionBounds = TextService.GetTextBoundsAsync(listBoundsParams);
			width = math.max(width, suggestionBounds.X);
		}

		const height =
			suggestions.size() * px(SUGGESTION_TEXT_SIZE + 6) +
			(suggestions.size() - 1) * px(4) +
			px(8);

		return new Vector2(width, height);
	});

	const windowSize = derive(() => {
		const width =
			math.max(
				titleBounds().X,
				descriptionBounds().X,
				errorBounds().X,
				listBounds().X,
			) + typeBadgeBounds().X;

		const height = titleBounds().Y + descriptionBounds().Y + errorBounds().Y;

		const padding = px(PADDING * 2);
		if (width === 0 || height === 0) {
			return UDim2.fromOffset(0, suggestionRef()?.AbsoluteSize.Y ?? 0);
		}

		return UDim2.fromOffset(width + padding, height + padding);
	});

	return (
		<Group size={UDim2.fromScale(1, 1)}>
			<MainSuggestion
				suggestion={currentSuggestion}
				currentText={currentTextPart}
				size={spring(windowSize, 0.2)}
				titleSize={offset(titleBounds)}
				descriptionSize={offset(descriptionBounds)}
				badgeSize={offset(typeBadgeBounds)}
				errorSize={offset(errorBounds)}
				action={suggestionRef}
			/>

			<SuggestionList
				suggestion={currentSuggestion}
				currentText={currentTextPart}
				size={spring(
					() => UDim2.fromOffset(windowSize().X.Offset, listBounds().Y),
					0.3,
				)}
			/>

			<uilistlayout Padding={() => new UDim(0, px(PADDING))} />
		</Group>
	);
}
