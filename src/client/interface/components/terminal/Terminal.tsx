import Roact, { useContext, useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { HistoryEntry } from "../../../types";
import { images } from "../../constants/images";
import { palette } from "../../constants/palette";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { DataContext } from "../../providers/dataProvider";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Image } from "../interface/Image";
import { Padding } from "../interface/Padding";
import { PrimaryButton } from "../interface/PrimaryButton";
import { ScrollingFrame } from "../interface/ScrollingFrame";
import { Shadow } from "../interface/Shadow";
import { HistoryLine } from "./HistoryLine";
import { SuggestionList } from "./SuggestionList";
import { TerminalTextField } from "./TerminalTextField";

interface HistoryLineData {
	height: number;
	entry: HistoryEntry;
}

export default function Terminal() {
	const rem = useRem();
	const data = useContext(DataContext);

	const [history, setHistory] = useState<HistoryLineData[]>([]);
	const [historyHeight, historyHeightMotion] = useMotion(0);
	const windowHeightBinding = useMemo(() => {
		return historyHeight.map((y) => {
			return new UDim2(1, 0, 0, rem(5) + y);
		});
	}, [rem]);

	useEffect(() => {
		const historySize = data.history.size();
		let totalHeight = historySize > 0 ? rem(0.5) + (historySize - 1) * rem(0.5) : 0;

		const historyLines: HistoryLineData[] = [];
		const textMaxBounds = new Vector2(math.huge, math.huge);
		for (const entry of data.history) {
			const textSize = TextService.GetTextSize(entry.text, rem(1.5), "GothamMedium", textMaxBounds);
			totalHeight += textSize.Y;
			historyLines.push({
				height: textSize.Y,
				entry,
			});
		}

		historyHeightMotion.spring(totalHeight);
		setHistory(historyLines);
	}, [data.history, rem]);

	return (
		<Group
			key="terminal"
			anchorPoint={new Vector2(0.5)}
			size={new UDim2(1, -rem(4), 0, rem(32))}
			position={new UDim2(0.5, 0, 0, rem(2))}
		>
			<Frame
				key="terminal-bg"
				size={windowHeightBinding}
				backgroundColor={palette.crust}
				cornerRadius={new UDim(0, rem(0.5))}
			>
				<Padding all={new UDim(0, rem(0.5))} />

				<ScrollingFrame
					key="terminal-history"
					size={historyHeight.map((y) => new UDim2(1, 0, 0, y))}
					canvasSize={new UDim2()}
				>
					{history.map((data) => (
						<HistoryLine size={new UDim2(1, 0, 0, data.height)} data={data.entry} />
					))}
					<uilistlayout Padding={new UDim(0, rem(0.5))} />
				</ScrollingFrame>

				<Group
					key="terminal-bottom"
					anchorPoint={new Vector2(0, 1)}
					size={new UDim2(1, 0, 0, rem(4))}
					position={UDim2.fromScale(0, 1)}
				>
					<TerminalTextField size={new UDim2(1, -rem(4.5), 1, 0)} />

					<PrimaryButton
						anchorPoint={new Vector2(1, 0.5)}
						size={new UDim2(0, rem(4), 1, 0)}
						position={new UDim2(1, 0, 0.5, 0)}
						color={palette.green}
						animatePosition={false}
						cornerRadius={new UDim(0, rem(0.5))}
					>
						<Image
							anchorPoint={new Vector2(0.5, 0.5)}
							size={new UDim2(1, -rem(1), 1, -rem(1))}
							position={UDim2.fromScale(0.5, 0.5)}
							image={images.play}
						/>
					</PrimaryButton>
				</Group>

				<Shadow shadowSize={rem(1)} />
			</Frame>

			<SuggestionList key="suggestions" position={new UDim2(0, 0, 0, rem(6))} suggestions={[]} />
		</Group>
	);
}
