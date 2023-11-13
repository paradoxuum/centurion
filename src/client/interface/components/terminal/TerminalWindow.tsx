import { useSelector } from "@rbxts/react-reflex";
import Roact, { useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { images } from "../../constants/images";
import { palette } from "../../constants/palette";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { selectHistory } from "../../store/app";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Image } from "../interface/Image";
import { Padding } from "../interface/Padding";
import { PrimaryButton } from "../interface/PrimaryButton";
import { ScrollingFrame } from "../interface/ScrollingFrame";
import { Shadow } from "../interface/Shadow";
import { HistoryLine } from "./HistoryLine";
import { TerminalTextField } from "./TerminalTextField";

interface TerminalWindowProps {
	onSubmit?: (text: string) => void;
}

export function TerminalWindow({ onSubmit }: TerminalWindowProps) {
	const rem = useRem();
	const store = useStore();

	const history = useSelector(selectHistory);
	const [historyLines, setHistoryLines] = useState<number[]>([]);
	const [historyHeight, historyHeightMotion] = useMotion(0);
	const [historyCanvas, setHistoryCanvas] = useState({
		scrollingEnabled: false,
		size: new UDim2(),
		position: new Vector2(),
	});

	const windowHeightBinding = useMemo(() => {
		return historyHeight.map((y) => {
			return new UDim2(1, 0, 0, math.ceil(rem(5) + y));
		});
	}, [rem]);

	useEffect(() => {
		const historySize = history.size();
		let totalHeight = historySize > 0 ? rem(0.5) + (historySize - 1) * rem(0.5) : 0;

		const historyLines: number[] = [];
		const textMaxBounds = new Vector2(math.huge, math.huge);
		for (const entry of history) {
			const textSize = TextService.GetTextSize(entry.text, rem(1.5), "GothamMedium", textMaxBounds);
			totalHeight += textSize.Y;
			historyLines.push(textSize.Y);
		}

		const isClamped = totalHeight > rem(16);
		const clampedHeight = isClamped ? rem(16) : totalHeight;
		historyHeightMotion.spring(clampedHeight);
		setHistoryLines(historyLines);
		setHistoryCanvas({
			scrollingEnabled: isClamped,
			size: new UDim2(0, 0, 0, totalHeight - rem(1)),
			position: new Vector2(0, totalHeight),
		});
	}, [history, rem]);

	return (
		<Frame size={windowHeightBinding} backgroundColor={palette.crust} cornerRadius={new UDim(0, rem(0.5))}>
			<Padding key="padding" all={new UDim(0, rem(0.5))} />

			<ScrollingFrame
				key="history"
				size={new UDim2(1, 0, 1, -rem(4.5))}
				canvasSize={historyCanvas.size}
				canvasPosition={historyCanvas.position}
				scrollBarColor={palette.surface2}
				scrollBarThickness={historyCanvas.scrollingEnabled ? 10 : 0}
			>
				{historyLines.map((height, i) => {
					const entry = history[i];
					if (entry === undefined) {
						return <></>;
					}

					return <HistoryLine key={`${entry.sentAt}-${i}`} size={new UDim2(1, 0, 0, height)} data={entry} />;
				})}

				<uilistlayout key="layout" Padding={new UDim(0, rem(0.5))} SortOrder="LayoutOrder" />
			</ScrollingFrame>

			<Group
				key="command-bar"
				anchorPoint={new Vector2(0, 1)}
				size={new UDim2(1, 0, 0, rem(4))}
				position={UDim2.fromScale(0, 1)}
			>
				<TerminalTextField
					key="text-field"
					size={new UDim2(1, -rem(4.5), 1, 0)}
					onTextChange={(text) => {
						store.setText(text);
					}}
					onSubmit={onSubmit}
				/>

				<PrimaryButton
					key="execute-button"
					anchorPoint={new Vector2(1, 0.5)}
					size={new UDim2(0, rem(4), 1, 0)}
					position={new UDim2(1, 0, 0.5, 0)}
					color={palette.green}
					animatePosition={false}
					cornerRadius={new UDim(0, rem(0.5))}
				>
					<Image
						key="icon"
						anchorPoint={new Vector2(0.5, 0.5)}
						size={new UDim2(1, -rem(1), 1, -rem(1))}
						position={UDim2.fromScale(0.5, 0.5)}
						image={images.play}
					/>
				</PrimaryButton>
			</Group>

			<Shadow key="shadow" shadowSize={rem(1)} />
		</Frame>
	);
}
