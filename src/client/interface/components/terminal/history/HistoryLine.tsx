import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { useMemo } from "@rbxts/roact";
import { HistoryEntry } from "../../../../types";
import { fonts } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { useRem } from "../../../hooks/useRem";
import { Frame } from "../../interface/Frame";
import { Group } from "../../interface/Group";
import { Outline } from "../../interface/Outline";
import { Text } from "../../interface/Text";

interface HistoryLineProps {
	data: HistoryEntry;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	order?: BindingOrValue<number>;
}

export function HistoryLine({ data, size, position, order }: HistoryLineProps) {
	const rem = useRem();
	const date = useMemo(() => {
		const dateTime = DateTime.fromUnixTimestamp(
			data.sentAt,
		).FormatUniversalTime("LT", "en-us");
		const dateParts = dateTime.split(" ");
		return `<b>${dateParts[0]}</b>${dateParts[1]}`;
	}, [data]);

	return (
		<Group size={size} position={position} layoutOrder={order}>
			<Frame
				key="date"
				backgroundColor={palette.base}
				size={UDim2.fromOffset(rem(6), rem(1.5))}
				cornerRadius={new UDim(1, 0)}
			>
				<Text
					key="text"
					size={UDim2.fromScale(1, 1)}
					text={date}
					textColor={palette.white}
					textSize={rem(1.2)}
					richText={true}
				/>

				<Outline
					key="outline"
					innerThickness={rem(2, "pixel")}
					innerTransparency={0.25}
					innerColor={data.success ? palette.green : palette.red}
					outerThickness={0}
					cornerRadius={new UDim(1, 0)}
				/>
			</Frame>

			<Text
				key="entry-text"
				anchorPoint={new Vector2(1, 0)}
				size={new UDim2(1, -rem(6.5), 1, 0)}
				position={UDim2.fromScale(1, 0)}
				text={data.text}
				textSize={rem(1.5)}
				textColor={data.success ? palette.white : palette.red}
				textXAlignment="Left"
				font={fonts.inter.medium}
				richText={true}
			/>
		</Group>
	);
}
