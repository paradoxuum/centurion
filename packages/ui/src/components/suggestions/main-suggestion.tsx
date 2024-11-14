import Vide, { Derivable, read, spring } from "@rbxts/vide";
import {
	SUGGESTION_TEXT_SIZE,
	SUGGESTION_TITLE_TEXT_SIZE,
} from "../../constants/text";
import { px } from "../../hooks/use-px";
import { mouseOverInterface, options } from "../../store";
import { Suggestion } from "../../types";
import { Frame } from "../ui/frame";
import { Padding } from "../ui/padding";
import { Text } from "../ui/text";
import { Badge } from "./badge";
import { highlightMatching } from "./util";

export interface MainSuggestionProps {
	suggestion: Derivable<Suggestion | undefined>;
	currentText?: Derivable<string | undefined>;
	size: Derivable<UDim2>;
	titleSize: Derivable<UDim2>;
	descriptionSize: Derivable<UDim2>;
	badgeSize: Derivable<UDim2>;
	errorSize: Derivable<UDim2>;
	action?: (instance: Frame) => void;
}

export function MainSuggestion({
	suggestion,
	currentText,
	size,
	titleSize,
	descriptionSize,
	badgeSize,
	errorSize,
	action,
}: MainSuggestionProps) {
	return (
		<Frame
			action={action}
			size={size}
			backgroundColor={() => read(options().palette).background}
			backgroundTransparency={() => read(options().backgroundTransparency) ?? 0}
			cornerRadius={() => new UDim(0, px(8))}
			native={{
				MouseEnter: () => mouseOverInterface(true),
				MouseLeave: () => mouseOverInterface(false),
			}}
		>
			<Padding all={() => new UDim(0, px(8))} />

			<Badge
				color={() => read(options().palette).highlight}
				text={() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion !== undefined &&
						currentSuggestion.type === "argument"
						? currentSuggestion.dataType
						: "";
				}}
				textColor={() => read(options().palette).surface}
				textSize={() => px(SUGGESTION_TEXT_SIZE)}
				visible={() => {
					const currentSuggestion = read(suggestion);
					return (
						currentSuggestion !== undefined &&
						currentSuggestion.type === "argument"
					);
				}}
				anchor={new Vector2(1, 0)}
				position={UDim2.fromScale(1, 0)}
				size={spring(() => {
					return UDim2.fromOffset(
						read(badgeSize).X.Offset + px(4),
						px(SUGGESTION_TITLE_TEXT_SIZE),
					);
				}, 0.2)}
			/>

			<Text
				text={() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion?.type === "argument"
						? currentSuggestion.title
						: highlightMatching(
								read(options().palette).highlight,
								currentSuggestion?.title,
								read(currentText),
							);
				}}
				textSize={() => px(SUGGESTION_TITLE_TEXT_SIZE)}
				textColor={() => read(options().palette).text}
				textXAlignment="Left"
				textYAlignment="Top"
				font={() => read(options().font).bold}
				richText
				size={titleSize}
			/>

			<Text
				text={() => read(suggestion)?.description ?? ""}
				textSize={() => px(SUGGESTION_TEXT_SIZE)}
				textColor={() => read(options().palette).subtext}
				textXAlignment="Left"
				textYAlignment="Top"
				textWrapped
				richText
				position={() => UDim2.fromOffset(0, px(SUGGESTION_TITLE_TEXT_SIZE))}
				size={descriptionSize}
			/>

			<Text
				text={() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion !== undefined &&
						currentSuggestion.type === "argument"
						? (currentSuggestion.error ?? "")
						: "";
				}}
				textColor={() => read(options().palette).error}
				textSize={() => px(SUGGESTION_TEXT_SIZE)}
				textTransparency={spring(() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion?.type === "argument" &&
						currentSuggestion.error !== undefined
						? 0
						: 1;
				}, 0.2)}
				textXAlignment="Left"
				anchor={new Vector2(0, 1)}
				position={UDim2.fromScale(0, 1)}
				size={errorSize}
			/>
		</Frame>
	);
}
