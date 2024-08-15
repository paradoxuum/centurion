import { TextService } from "@rbxts/services";
import Vide, { cleanup, derive, spring } from "@rbxts/vide";
import {
	SUGGESTION_TEXT_SIZE,
	SUGGESTION_TITLE_TEXT_SIZE,
} from "../../constants/text";
import { useAtom } from "../../hooks/use-atom";
import { px } from "../../hooks/use-px";
import { useTextBounds } from "../../hooks/use-text-bounds";
import {
	currentSuggestion,
	currentTextPart,
	interfaceOptions,
} from "../../store";
import { Group } from "../ui/group";
import { MainSuggestion } from "./main-suggestion";
import { SuggestionList } from "./suggestion-list";

const MAX_SUGGESTION_WIDTH = 180;
const MAX_BADGE_WIDTH = 80;
const PADDING = 8;

export function Suggestions() {
	const options = useAtom(interfaceOptions);
	const textPart = useAtom(currentTextPart);
	const suggestion = useAtom(currentSuggestion);

	const titleBounds = useTextBounds({
		text: () => suggestion()?.title,
		font: () => options().font.bold,
		size: () => px(SUGGESTION_TITLE_TEXT_SIZE),
	});

	const descriptionBounds = useTextBounds({
		text: () => suggestion()?.description,
		font: () => options().font.regular,
		size: () => px(SUGGESTION_TEXT_SIZE),
		width: () => px(MAX_SUGGESTION_WIDTH),
	});

	const typeBadgeBounds = useTextBounds({
		text: () => {
			const currentSuggestion = suggestion();
			if (currentSuggestion?.type === "command") return;
			return currentSuggestion?.dataType;
		},
		font: () => options().font.bold,
		size: () => px(SUGGESTION_TEXT_SIZE),
	});

	const errorBounds = useTextBounds({
		text: () => {
			const current = suggestion();
			if (current?.type === "command") return;
			return current?.error;
		},
		font: () => options().font.regular,
		size: () => px(SUGGESTION_TEXT_SIZE),
	});

	const listBoundsParams = new Instance("GetTextBoundsParams");
	listBoundsParams.RichText = true;
	cleanup(listBoundsParams);

	const listBounds = derive(() => {
		let width = 0;

		const suggestions = suggestion()?.others ?? [];
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

		if (width === 0 || height === 0) {
			return UDim2.fromOffset(
				0,
				px(SUGGESTION_TITLE_TEXT_SIZE) + px(SUGGESTION_TEXT_SIZE),
			);
		}

		const padding = px(PADDING * 2);
		return UDim2.fromOffset(width + padding, height + padding);
	});

	return (
		<Group
			size={UDim2.fromScale(1, 1)}
			visible={currentSuggestion !== undefined}
		>
			<MainSuggestion
				suggestion={suggestion}
				currentText={textPart}
				size={spring(windowSize, 0.2)}
				titleSize={() => {
					const bounds = titleBounds();
					return UDim2.fromOffset(bounds.X, bounds.Y);
				}}
				descriptionSize={() => {
					const bounds = descriptionBounds();
					return UDim2.fromOffset(bounds.X, bounds.Y);
				}}
				badgeSize={() => {
					const bounds = typeBadgeBounds();
					return UDim2.fromOffset(bounds.X, bounds.Y);
				}}
				errorSize={() => {
					const bounds = errorBounds();
					return UDim2.fromOffset(bounds.X, bounds.Y);
				}}
			/>

			<SuggestionList
				suggestion={suggestion}
				currentText={textPart}
				size={spring(
					() => UDim2.fromOffset(windowSize().X.Offset, listBounds().Y),
					0.3,
				)}
			/>

			<uilistlayout Padding={() => new UDim(0, px(PADDING))} />
		</Group>
	);
}
