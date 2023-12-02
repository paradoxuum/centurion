import { BindingOrValue, mapBinding } from "@rbxts/pretty-react-hooks";
import Roact, { useBinding, useEffect } from "@rbxts/roact";
import { palette } from "../../../constants/palette";
import { useRem } from "../../../hooks/useRem";
import { HistoryLineData } from "../../../types";
import { ScrollingFrame } from "../../interface/ScrollingFrame";
import { HistoryLine } from "./HistoryLine";

export interface HistoryData {
	lines: HistoryLineData[];
	height: number;
}

interface HistoryListProps {
	data: HistoryData;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	maxHeight?: number;
	scrollingEnabled?: BindingOrValue<boolean>;
}

export function HistoryList({
	data,
	size,
	position,
	maxHeight,
}: HistoryListProps) {
	const rem = useRem();

	const [scrollingEnabled, setScrollingEnabled] = useBinding(false);
	const [canvasSize, setCanvasSize] = useBinding(new UDim2());
	const [canvasPosition, setCanvasPosition] = useBinding(new Vector2());

	useEffect(() => {
		const height = data.height - rem(0.5);
		setCanvasSize(new UDim2(0, 0, 0, height));
		setCanvasPosition(new Vector2(0, height));

		if (maxHeight !== undefined) setScrollingEnabled(height > maxHeight);
	}, [data, rem]);

	return (
		<ScrollingFrame
			size={size}
			position={position}
			canvasSize={canvasSize}
			canvasPosition={canvasPosition}
			scrollBarColor={palette.surface2}
			scrollBarThickness={mapBinding(scrollingEnabled, (val) => {
				return val ? 10 : 0;
			})}
			scrollingEnabled={scrollingEnabled}
		>
			{data.lines.map((data, i) => {
				return (
					<HistoryLine
						key={`${data.entry.sentAt}-${i}`}
						size={new UDim2(1, 0, 0, data.height)}
						data={data.entry}
					/>
				);
			})}

			<uilistlayout
				key="layout"
				Padding={new UDim(0, rem(0.5))}
				SortOrder="LayoutOrder"
			/>
		</ScrollingFrame>
	);
}
