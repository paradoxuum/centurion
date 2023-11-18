import { BindingOrValue, getBindingValue } from "@rbxts/pretty-react-hooks";
import Roact, { useBinding, useEffect } from "@rbxts/roact";
import { palette } from "../../../constants/palette";
import { useRem } from "../../../hooks/useRem";
import { HistoryLineData } from "../../../types";
import { ScrollingFrame } from "../../interface/ScrollingFrame";
import { HistoryLine } from "./HistoryLine";

interface HistoryListProps {
	historyLines: HistoryLineData[];
	historyHeight: BindingOrValue<number>;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	scrollingEnabled?: BindingOrValue<boolean>;
}

export function HistoryList({ historyLines, historyHeight, size, position, scrollingEnabled }: HistoryListProps) {
	const rem = useRem();

	const [canvasSize, setCanvasSize] = useBinding(new UDim2());
	const [canvasPosition, setCanvasPosition] = useBinding(new Vector2());

	useEffect(() => {
		const totalHeight = getBindingValue(historyHeight);
		setCanvasSize(new UDim2(0, 0, 0, totalHeight - rem(1)));
		setCanvasPosition(new Vector2(0, totalHeight));
	}, [historyHeight, rem]);

	return (
		<ScrollingFrame
			size={size}
			position={position}
			canvasSize={canvasSize}
			canvasPosition={canvasPosition}
			scrollBarColor={palette.surface2}
			scrollBarThickness={scrollingEnabled ? 10 : 0}
			scrollingEnabled={scrollingEnabled}
		>
			{historyLines.map((data, i) => {
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
