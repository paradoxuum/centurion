import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { useContext, useMemo } from "@rbxts/roact";
import { HistoryEntry } from "../../../../types";
import { palette } from "../../../constants/palette";
import { HISTORY_TEXT_SIZE } from "../../../constants/text";
import { usePx } from "../../../hooks/usePx";
import { OptionsContext } from "../../../providers/optionsProvider";
import { Frame } from "../../interface/Frame";
import { Group } from "../../interface/Group";
import { Outline } from "../../interface/Outline";
import { Text } from "../../interface/Text";
import { TextField } from "../../interface/TextField";

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
				key="date"
				backgroundColor={palette.base}
				size={UDim2.fromOffset(px(76), px(HISTORY_TEXT_SIZE + 4))}
				cornerRadius={new UDim(0, px(4))}
			>
				<Text
					key="text"
					size={UDim2.fromScale(1, 1)}
					text={date}
					textColor={palette.text}
					textSize={px(HISTORY_TEXT_SIZE)}
					richText={true}
				/>

				<Outline
					key="outline"
					innerThickness={px(1)}
					innerTransparency={0.25}
					innerColor={data.success ? palette.green : palette.red}
					outerThickness={0}
					cornerRadius={new UDim(0, px(4))}
				/>
			</Frame>

			<TextField
				key="entry-text"
				anchorPoint={new Vector2(1, 0)}
				size={new UDim2(1, -px(84), 1, 0)}
				position={UDim2.fromScale(1, 0)}
				text={data.text}
				textSize={px(HISTORY_TEXT_SIZE)}
				textColor={data.success ? palette.text : palette.red}
				textEditable={false}
				textXAlignment="Left"
				clearTextOnFocus={false}
				font={options.font.medium}
				richText
			/>
		</Group>
	);
}
