import { TextService } from "@rbxts/services";
import Vide, {
	cleanup,
	Derivable,
	derive,
	read,
	source,
	spring,
} from "@rbxts/vide";
import { SUGGESTION_TEXT_SIZE } from "../../constants/text";
import { useClient } from "../../hooks/use-client";
import { px } from "../../hooks/use-px";
import { updateText } from "../../hooks/use-text-box";
import { currentSuggestion, currentTextPart, terminalText } from "../../store";
import {
	completeArgument,
	completeCommand,
} from "../terminal/terminal-text-field/suggestion";
import { Group } from "../ui/group";
import { MainSuggestion } from "./main-suggestion";
import { SuggestionList } from "./suggestion-list";

const PADDING = 8;

interface SuggestionsProps {
	textParts: Derivable<string[]>;
}

export function Suggestions({ textParts }: SuggestionsProps) {
	const client = useClient();
	const mainSize = source(new UDim2());

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

	return (
		<Group automaticSize="XY" size={UDim2.fromOffset(0, 0)}>
			<MainSuggestion
				suggestion={currentSuggestion}
				currentText={currentTextPart}
				onSizeChanged={mainSize}
				onClick={() => {
					const suggestion = currentSuggestion();
					if (suggestion === undefined) return;

					if (suggestion.type === "command") {
						updateText(
							completeCommand(
								client.registry,
								terminalText(),
								read(textParts),
								suggestion.title,
							),
						);
					}
				}}
				clickable={() => currentSuggestion()?.type === "command"}
			/>

			<SuggestionList
				suggestion={currentSuggestion}
				currentText={currentTextPart}
				onClick={(text) => {
					updateText(completeArgument(terminalText(), text, 1, false));
				}}
				textParts={textParts}
				size={spring(
					() =>
						new UDim2(
							0,
							math.max(listBounds().X, mainSize().X.Offset),
							0,
							listBounds().Y,
						),
					0.3,
				)}
			/>

			<uilistlayout Padding={() => new UDim(0, px(PADDING))} />
		</Group>
	);
}
