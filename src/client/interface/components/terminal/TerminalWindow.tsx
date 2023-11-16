import { useEventListener, useMountEffect } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, { useContext, useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { palette } from "../../constants/palette";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { DataContext } from "../../providers/dataProvider";
import { selectHistory } from "../../store/app";
import { HistoryLineData } from "../../types";
import { Frame } from "../interface/Frame";
import { Padding } from "../interface/Padding";
import { Shadow } from "../interface/Shadow";
import { TerminalTextField } from "./TerminalTextField";
import { HistoryList } from "./history";

export function TerminalWindow() {
	const rem = useRem();
	const store = useStore();
	const data = useContext(DataContext);

	const history = useSelector(selectHistory);
	const [historyLines, setHistoryLines] = useState<HistoryLineData[]>([]);
	const [historyHeight, historyHeightMotion] = useMotion(0);

	useMountEffect(() => {
		store.setHistory(data.history);
	});
	useEventListener(data.onHistoryUpdated, (entry) => {
		store.addHistoryEntry(entry);
	});

	const windowHeightBinding = useMemo(() => {
		return historyHeight.map((y) => {
			return new UDim2(1, 0, 0, math.ceil(rem(5) + y));
		});
	}, [rem]);

	useEffect(() => {
		const historySize = history.size();
		let totalHeight = historySize > 0 ? rem(0.5) + (historySize - 1) * rem(0.5) : 0;

		const historyLines: HistoryLineData[] = [];
		const textMaxBounds = new Vector2(math.huge, math.huge);
		for (const entry of history) {
			const textSize = TextService.GetTextSize(entry.text, rem(1.5), "GothamMedium", textMaxBounds);
			totalHeight += textSize.Y;
			historyLines.push({ entry, height: textSize.Y });
		}

		const isClamped = totalHeight > rem(16);
		const clampedHeight = isClamped ? rem(16) : totalHeight;
		historyHeightMotion.spring(clampedHeight);
		setHistoryLines(historyLines);
	}, [history, rem]);

	return (
		<Frame size={windowHeightBinding} backgroundColor={palette.crust} cornerRadius={new UDim(0, rem(0.5))}>
			<Padding key="padding" all={new UDim(0, rem(0.5))} />

			<HistoryList key="history" historyLines={historyLines} historyHeight={historyHeight} />

			<TerminalTextField
				key="text-field"
				anchorPoint={new Vector2(0, 1)}
				size={UDim2.fromScale(1, 1)}
				position={UDim2.fromScale(0, 1)}
				onTextChange={(text) => {
					store.setText(text);
				}}
				onSubmit={(text) => {
					print(store.getState().app.terminalText.value);
				}}
			/>

			<Shadow key="shadow" shadowSize={rem(1)} />
		</Frame>
	);
}
