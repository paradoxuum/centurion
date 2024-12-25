import Vide, { Derivable, derive, read, source, spring } from "@rbxts/vide";
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
import { highlightMatching } from "./util";

export interface MainSuggestionProps {
	suggestion: Derivable<Suggestion | undefined>;
	currentText?: Derivable<string | undefined>;
	action?: (instance: Frame) => void;
	onSizeChanged?: (size: UDim2) => void;
}

const MAX_WIDTH = 180;

export function MainSuggestion({
	suggestion,
	currentText,
	action,
	onSizeChanged,
}: MainSuggestionProps) {
	const titleBounds = source(new Vector2());
	const descriptionBounds = source(new Vector2());
	const errorBounds = source(new Vector2());
	const badgeBounds = source(new Vector2());
	const errorText = derive(() => {
		const currentSuggestion = read(suggestion);
		return currentSuggestion?.type === "argument"
			? currentSuggestion.error
			: undefined;
	});

	const windowSize = derive(() => {
		if (read(suggestion) === undefined) {
			const size = new UDim2();
			onSizeChanged?.(size);
			return size;
		}

		const titleSize = read(titleBounds);
		const descriptionSize = read(descriptionBounds);
		const errorSize = read(errorBounds);

		const width =
			math.max(titleSize.X, descriptionSize.X, errorSize.X) + badgeBounds().X;
		const height = titleSize.Y + descriptionSize.Y + errorSize.Y;

		const size = UDim2.fromOffset(width + px(8) * 2, height + px(8) * 2);
		onSizeChanged?.(size);
		return size;
	});

	return (
		<Frame
			action={action}
			size={spring(windowSize, 0.2)}
			backgroundColor={() => options().palette.background}
			backgroundTransparency={() => options().backgroundTransparency ?? 0}
			cornerRadius={() => new UDim(0, px(8))}
			native={{
				MouseEnter: () => mouseOverInterface(true),
				MouseLeave: () => mouseOverInterface(false),
			}}
		>
			<Padding all={() => new UDim(0, px(8))} />

			<Text
				text={() => {
					const currentSuggestion = read(suggestion);
					return currentSuggestion?.type === "argument"
						? currentSuggestion.title
						: highlightMatching(
								options().palette.highlight,
								currentSuggestion?.title,
								read(currentText),
							);
				}}
				textSize={() => px(SUGGESTION_TITLE_TEXT_SIZE)}
				textColor={() => options().palette.text}
				textXAlignment="Left"
				textYAlignment="Top"
				font={() => options().font.bold}
				richText
				size={() =>
					UDim2.fromOffset(titleBounds().X, px(SUGGESTION_TITLE_TEXT_SIZE))
				}
				native={{
					TextBoundsChanged: (bounds) => titleBounds(bounds),
				}}
			/>

			<Text
				text={() => read(suggestion)?.description ?? ""}
				textSize={() => px(SUGGESTION_TEXT_SIZE)}
				textColor={() => options().palette.subtext}
				textXAlignment="Left"
				textYAlignment="Top"
				textWrapped
				richText
				position={() => UDim2.fromOffset(0, px(SUGGESTION_TITLE_TEXT_SIZE))}
				size={() =>
					UDim2.fromOffset(
						px(MAX_WIDTH),
						math.max(descriptionBounds().Y, px(SUGGESTION_TEXT_SIZE)),
					)
				}
				native={{
					TextBoundsChanged: (rbx) => descriptionBounds(rbx),
				}}
			/>

			<Text
				text={() => errorText() ?? ""}
				textColor={() => options().palette.error}
				textSize={() => px(SUGGESTION_TEXT_SIZE)}
				textTransparency={spring(() => {
					return errorText() !== undefined ? 0 : 1;
				}, 0.2)}
				textXAlignment="Left"
				textWrapped
				automaticSize="Y"
				anchor={new Vector2(0, 1)}
				position={UDim2.fromScale(0, 1)}
				size={() => UDim2.fromOffset(px(MAX_WIDTH), 0)}
				native={{
					TextBoundsChanged: (bounds) => {
						errorBounds(errorText() !== undefined ? bounds : Vector2.zero);
					},
				}}
			/>

			<Frame
				backgroundColor={() => options().palette.highlight}
				cornerRadius={() => new UDim(0, px(4))}
				clipsDescendants
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
						badgeBounds().X + px(4),
						px(SUGGESTION_TITLE_TEXT_SIZE),
					);
				}, 0.2)}
			>
				<Text
					text={() => {
						const currentSuggestion = read(suggestion);
						return currentSuggestion !== undefined &&
							currentSuggestion.type === "argument"
							? currentSuggestion.dataType
							: "";
					}}
					textColor={() => options().palette.surface}
					textSize={() => px(SUGGESTION_TEXT_SIZE)}
					textXAlignment="Center"
					font={() => options().font.bold}
					size={UDim2.fromScale(1, 1)}
					native={{
						TextBoundsChanged: (bounds) => badgeBounds(bounds),
					}}
				/>
			</Frame>
		</Frame>
	);
}
