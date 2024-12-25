import { HistoryEntry } from "@rbxts/centurion";
import Vide, {
	Derivable,
	derive,
	effect,
	For,
	read,
	source,
} from "@rbxts/vide";
import { HISTORY_TEXT_SIZE } from "../../constants/text";
import { px } from "../../hooks/use-px";
import { options } from "../../store";
import { HistoryData, HistoryLineData } from "../../types";
import { ScrollingFrame } from "../ui/scrolling-frame";
import { HistoryLine } from "./history-line";

interface HistoryListProps {
	entries: Derivable<HistoryEntry[]>;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	scrollingEnabled?: Derivable<boolean>;
	onContentSizeChanged?: (size: Vector2) => void;
}

export function HistoryList({
	entries,
	size,
	position,
	scrollingEnabled,
	onContentSizeChanged,
}: HistoryListProps) {
	const ref = source<ScrollingFrame>();

	return (
		<ScrollingFrame
			automaticCanvasSize="Y"
			size={size}
			position={position}
			canvasSize={new UDim2()}
			action={ref}
			scrollBarColor={() => options().palette.subtext}
			scrollingEnabled={scrollingEnabled}
			scrollBarThickness={() => (read(scrollingEnabled) ? 10 : 0)}
			scrollingDirection="Y"
			native={{
				AbsoluteCanvasSizeChanged: (rbx) => {
					const frame = ref();
					if (frame === undefined) return;
					frame.CanvasPosition = new Vector2(0, rbx.Y);
				},
			}}
		>
			<For each={() => read(entries)}>
				{(entry: HistoryEntry, index: () => number) => {
					return <HistoryLine data={entry} order={index} />;
				}}
			</For>

			<uilistlayout
				Padding={() => new UDim(0, px(8))}
				SortOrder="LayoutOrder"
				AbsoluteContentSizeChanged={(rbx) => onContentSizeChanged?.(rbx)}
			/>
		</ScrollingFrame>
	);
}
