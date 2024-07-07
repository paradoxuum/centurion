import { HistoryEntry } from "@rbxts/centurion";
import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import React, { useContext, useMemo } from "@rbxts/react";
import { HISTORY_TEXT_SIZE } from "../../../constants/text";
import { usePx } from "../../../hooks/use-px";
import { OptionsContext } from "../../../providers/options-provider";
import { Frame } from "../../interface/frame";
import { Group } from "../../interface/group";
import { Outline } from "../../interface/outline";
import { Text } from "../../interface/text";
import { TextField } from "../../interface/text-field";

interface HistoryLineProps {
	data: HistoryEntry;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	order?: BindingOrValue<number>;
}

export function HistoryLine({ data, size, position, order }: HistoryLineProps) {
	const options = useContext(OptionsContext);
	const px = usePx();
	const date = useMemo(() => {
		const dateTime = DateTime.fromUnixTimestamp(data.sentAt).FormatLocalTime(
			"LT",
			"en-us",
		);
		const dateParts = dateTime.split(" ");
		return `<b>${dateParts[0]}</b> ${dateParts[1]}`;
	}, [data]);

	return (
		<Group size={size} position={position} layoutOrder={order}>
			<Frame
				backgroundColor={options.palette.surface}
				size={UDim2.fromOffset(px(76), px(HISTORY_TEXT_SIZE + 4))}
				cornerRadius={new UDim(0, px(4))}
			>
				<Text
					size={UDim2.fromScale(1, 1)}
					text={date}
					textColor={options.palette.text}
					textSize={px(HISTORY_TEXT_SIZE)}
					richText={true}
				/>

				<Outline
					innerThickness={px(1)}
					innerTransparency={0.25}
					innerColor={
						data.success ? options.palette.success : options.palette.error
					}
					outerThickness={0}
					cornerRadius={new UDim(0, px(4))}
				/>
			</Frame>

			<TextField
				anchorPoint={new Vector2(1, 0)}
				size={new UDim2(1, -px(84), 1, 0)}
				position={UDim2.fromScale(1, 0)}
				text={data.text}
				textSize={px(HISTORY_TEXT_SIZE)}
				textColor={data.success ? options.palette.text : options.palette.error}
				textEditable={false}
				textXAlignment="Left"
				clearTextOnFocus={false}
				font={options.font.medium}
				richText
			/>
		</Group>
	);
}
