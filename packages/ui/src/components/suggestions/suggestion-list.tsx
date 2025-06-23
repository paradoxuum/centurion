import { ArrayUtil } from "@rbxts/centurion/out/shared/util/data";
import Vide, { Derivable, derive, For, read } from "@rbxts/vide";
import { SUGGESTION_TEXT_SIZE } from "../../constants/text";
import { px } from "../../hooks/use-px";
import { mouseOverInterface, options } from "../../store";
import { Suggestion } from "../../types";
import { Group } from "../ui/group";
import { Padding } from "../ui/padding";
import { Text } from "../ui/text";
import { highlightMatching } from "./util";

export interface SuggestionListProps {
	suggestion?: Derivable<Suggestion | undefined>;
	currentText?: Derivable<string | undefined>;
	onClick?: (text: string) => void;
	size: Derivable<UDim2>;
	textParts: Derivable<string[]>;
}

const MAX_SUGGESTIONS = 3;

export function SuggestionList({
	suggestion,
	currentText,
	onClick,
	size,
}: SuggestionListProps) {
	const suggestions = derive(() => {
		return ArrayUtil.slice(read(suggestion)?.others ?? [], 0, MAX_SUGGESTIONS);
	});

	return (
		<Group
			size={size}
			native={{
				MouseEnter: () => mouseOverInterface(true),
				MouseLeave: () => mouseOverInterface(false),
			}}
		>
			<uilistlayout
				SortOrder="LayoutOrder"
				Padding={() => new UDim(0, px(8))}
			/>

			<For each={suggestions}>
				{(name: string, i: () => number) => {
					return (
						<textbutton
							Size={() => new UDim2(1, 0, 0, px(SUGGESTION_TEXT_SIZE + 6))}
							BackgroundColor3={() => options().palette.background}
							BackgroundTransparency={() =>
								options().backgroundTransparency ?? 0
							}
							Text=""
							ClipsDescendants={true}
							LayoutOrder={i}
							Activated={() => onClick?.(name)}
						>
							<Padding all={() => new UDim(0, px(4))} />
							<uicorner CornerRadius={() => new UDim(0, px(8))} />

							<Text
								size={() => new UDim2(1, 0, 1, 0)}
								text={() =>
									highlightMatching(
										options().palette.highlight,
										name,
										read(currentText),
									)
								}
								textColor={() => options().palette.text}
								textSize={() => px(SUGGESTION_TEXT_SIZE)}
								textXAlignment="Left"
								richText={true}
							/>
						</textbutton>
					);
				}}
			</For>
		</Group>
	);
}
