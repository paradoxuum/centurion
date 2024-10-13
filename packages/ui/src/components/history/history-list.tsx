import Vide, { Derivable, derive, For, read } from "@rbxts/vide";
import { useAtom } from "@rbxts/vide-charm";
import { px } from "../../hooks/use-px";
import { interfaceOptions } from "../../store";
import { HistoryData, HistoryLineData } from "../../types";
import { ScrollingFrame } from "../ui/scrolling-frame";
import { HistoryLine } from "./history-line";

interface HistoryListProps {
	data: Derivable<HistoryData>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	maxHeight?: Derivable<number>;
	scrollingEnabled?: Derivable<boolean>;
}

export function HistoryList({
	data,
	size,
	position,
	maxHeight,
}: HistoryListProps) {
	const options = useAtom(interfaceOptions);

	const height = derive(() => read(data).height - px(8));
	const exceedsMaxHeight = derive(
		() => maxHeight !== undefined && height() > read(maxHeight),
	);

	return (
		<ScrollingFrame
			size={size}
			position={position}
			canvasSize={() => UDim2.fromOffset(0, height())}
			canvasPosition={() => new Vector2(0, height())}
			scrollBarColor={() => options().palette.subtext}
			scrollBarThickness={() => (exceedsMaxHeight() ? 10 : 0)}
			scrollingEnabled={() => exceedsMaxHeight()}
		>
			<For each={() => read(data).lines}>
				{(line: HistoryLineData, index: () => number) => {
					return (
						<HistoryLine
							size={new UDim2(1, 0, 0, line.height)}
							data={line.entry}
							order={index}
						/>
					);
				}}
			</For>

			<uilistlayout
				Padding={() => new UDim(0, px(8))}
				SortOrder="LayoutOrder"
			/>
		</ScrollingFrame>
	);
}
