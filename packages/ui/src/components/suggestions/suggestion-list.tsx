import Vide, { Derivable, For, read } from "@rbxts/vide";
import { SUGGESTION_TEXT_SIZE } from "../../constants/text";
import { useAtom } from "../../hooks/use-atom";
import { px } from "../../hooks/use-px";
import { interfaceOptions, mouseOverInterface } from "../../store";
import { Suggestion } from "../../types";
import { Frame } from "../ui/frame";
import { Group } from "../ui/group";
import { Padding } from "../ui/padding";
import { Text } from "../ui/text";
import { highlightMatching } from "./util";

export interface SuggestionListProps {
	suggestion?: Derivable<Suggestion | undefined>;
	currentText?: Derivable<string | undefined>;
	size: Derivable<UDim2>;
}

export function SuggestionList({
	suggestion,
	currentText,
	size,
}: SuggestionListProps) {
	const options = useAtom(interfaceOptions);

	return (
		<Group
			size={size}
			mouseEnter={() => mouseOverInterface(true)}
			mouseLeave={() => mouseOverInterface(false)}
		>
			<uilistlayout SortOrder="LayoutOrder" Padding={new UDim(0, px(8))} />

			<For each={() => read(suggestion)?.others ?? []}>
				{(name: string, i: () => number) => {
					return (
						<Frame
							size={new UDim2(1, 0, 0, px(SUGGESTION_TEXT_SIZE + 6))}
							backgroundColor={() => options().palette.background}
							backgroundTransparency={() =>
								options().backgroundTransparency ?? 0
							}
							cornerRadius={new UDim(0, px(8))}
							clipsDescendants={true}
						>
							<Padding all={new UDim(0, px(4))} />

							<Text
								size={new UDim2(1, 0, 1, 0)}
								text={() =>
									highlightMatching(
										options().palette.highlight,
										name,
										read(currentText),
									)
								}
								textColor={() => options().palette.text}
								textSize={px(SUGGESTION_TEXT_SIZE)}
								textXAlignment="Left"
								richText={true}
							/>
						</Frame>
					);
				}}
			</For>
		</Group>
	);
}
