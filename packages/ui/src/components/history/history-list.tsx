import Vide, { Derivable, effect, For, read, source } from "@rbxts/vide";
import { useAtom } from "../../hooks/use-atom";
import { px } from "../../hooks/use-px";
import { interfaceOptions } from "../../store";
import { HistoryData, HistoryLineData } from "../../types";
import { ScrollingFrame } from "../ui/scrolling-frame";
import { HistoryLine } from "./history-line";

interface HistoryListProps {
	data: Derivable<HistoryData>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	maxHeight?: number;
	scrollingEnabled?: Derivable<boolean>;
}

export function HistoryList({
	data,
	size,
	position,
	maxHeight,
}: HistoryListProps) {
	const options = useAtom(interfaceOptions);

	const scrollingEnabled = source(false);
	const canvasSize = source(new UDim2());
	const canvasPos = source(new Vector2());

	effect(() => {
		const height = read(data).height - px(8);
		canvasSize(new UDim2(0, 0, 0, height));
		canvasPos(new Vector2(0, height));

		if (maxHeight !== undefined) scrollingEnabled(height > maxHeight);
	});

	return (
		<ScrollingFrame
			size={size}
			position={position}
			canvasSize={canvasSize}
			canvasPosition={canvasPos}
			scrollBarColor={() => options().palette.subtext}
			scrollBarThickness={() => (scrollingEnabled() ? 10 : 0)}
			scrollingEnabled={scrollingEnabled}
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

			<uilistlayout Padding={new UDim(0, px(8))} SortOrder="LayoutOrder" />
		</ScrollingFrame>
	);
}
