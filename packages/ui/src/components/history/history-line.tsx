import { HistoryEntry } from "@rbxts/centurion";
import Vide, { Derivable, derive } from "@rbxts/vide";
import { HISTORY_TEXT_SIZE } from "../../constants/text";
import { useAtom } from "../../hooks/use-atom";
import { px } from "../../hooks/use-px";
import { interfaceOptions } from "../../store";
import { Frame } from "../ui/frame";
import { Group } from "../ui/group";
import { Outline } from "../ui/outline";
import { Text } from "../ui/text";
import { TextField } from "../ui/text-field";

interface HistoryLineProps {
	data: HistoryEntry;
	size?: Derivable<UDim2>;
	position?: Derivable<UDim2>;
	order?: Derivable<number>;
}

export function HistoryLine({ data, size, position, order }: HistoryLineProps) {
	const options = useAtom(interfaceOptions);

	const date = derive(() => {
		const dateTime = DateTime.fromUnixTimestamp(data.sentAt).FormatLocalTime(
			"LT",
			"en-us",
		);
		const dateParts = dateTime.split(" ");
		return `<b>${dateParts[0]}</b> ${dateParts[1]}`;
	});

	return (
		<Group size={size} position={position} layoutOrder={order}>
			<Frame
				backgroundColor={() => options().palette.surface}
				size={UDim2.fromOffset(px(76), px(HISTORY_TEXT_SIZE + 4))}
				cornerRadius={new UDim(0, px(4))}
			>
				<Text
					size={UDim2.fromScale(1, 1)}
					text={date}
					textColor={() => options().palette.text}
					textSize={() => px(HISTORY_TEXT_SIZE)}
					richText={true}
				/>

				<Outline
					innerThickness={() => px(1)}
					innerTransparency={0.25}
					innerColor={() => {
						return data.success
							? options().palette.success
							: options().palette.error;
					}}
					outerThickness={0}
					cornerRadius={new UDim(0, px(4))}
				/>
			</Frame>

			<TextField
				anchorPoint={new Vector2(1, 0)}
				size={() => new UDim2(1, -px(84), 1, 0)}
				position={UDim2.fromScale(1, 0)}
				text={data.text}
				textSize={px(HISTORY_TEXT_SIZE)}
				textColor={() => {
					const palette = options().palette;
					return data.success ? palette.text : palette.error;
				}}
				textEditable={false}
				textXAlignment="Left"
				clearTextOnFocus={false}
				font={() => options().font.medium}
				richText
			/>
		</Group>
	);
}
