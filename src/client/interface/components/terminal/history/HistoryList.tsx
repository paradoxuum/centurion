import { BindingOrValue, getBindingValue } from "@rbxts/pretty-react-hooks";
import Roact, { useEffect, useState } from "@rbxts/roact";
import { palette } from "../../../constants/palette";
import { useRem } from "../../../hooks/useRem";
import { useStore } from "../../../hooks/useStore";
import { HistoryLineData } from "../../../types";
import { ScrollingFrame } from "../../interface/ScrollingFrame";
import { HistoryLine } from "./HistoryLine";

interface HistoryListProps {
	historyLines: BindingOrValue<HistoryLineData[]>;
	historyHeight: BindingOrValue<number>;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	scrollingEnabled?: BindingOrValue<boolean>;
}

export function HistoryList({ historyLines, historyHeight, size, position, scrollingEnabled }: HistoryListProps) {
	const rem = useRem();
	const store = useStore();

	const [lineHeights, setLineHeights] = useState<number[]>([]);
	const [canvas, setCanvas] = useState({
		size: new UDim2(),
		position: new Vector2(),
	});

	useEffect(() => {
		const totalHeight = getBindingValue(historyHeight);
		setCanvas({
			size: new UDim2(0, 0, 0, totalHeight - rem(1)),
			position: new Vector2(0, totalHeight),
		});
	}, [historyHeight, rem]);

	return (
		<ScrollingFrame
			size={size}
			position={position}
			canvasSize={canvas.size}
			canvasPosition={canvas.position}
			scrollBarColor={palette.surface2}
			scrollBarThickness={scrollingEnabled ? 10 : 0}
			scrollingEnabled={scrollingEnabled}
		>
			{getBindingValue(historyLines).map((data, i) => {
				return (
					<HistoryLine
						key={`${data.entry.sentAt}-${i}`}
						size={new UDim2(1, 0, 0, data.height)}
						data={data.entry}
					/>
				);
			})}

			<uilistlayout key="layout" Padding={new UDim(0, rem(0.5))} SortOrder="LayoutOrder" />
		</ScrollingFrame>
	);
}
