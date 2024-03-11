import { BindingOrValue, mapBinding } from "@rbxts/pretty-react-hooks";
import React, { useBinding, useEffect } from "@rbxts/react";
import { palette } from "../../../constants/palette";
import { usePx } from "../../../hooks/usePx";
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
	const px = usePx();

	const [scrollingEnabled, setScrollingEnabled] = useBinding(false);
	const [canvasSize, setCanvasSize] = useBinding(new UDim2());
	const [canvasPosition, setCanvasPosition] = useBinding(new Vector2());

	useEffect(() => {
		const height = data.height - px(8);
		setCanvasSize(new UDim2(0, 0, 0, height));
		setCanvasPosition(new Vector2(0, height));

		if (maxHeight !== undefined) setScrollingEnabled(height > maxHeight);
	}, [data, px]);

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

			<uilistlayout Padding={new UDim(0, px(8))} SortOrder="LayoutOrder" />
		</ScrollingFrame>
	);
}
