import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { useMemo } from "@rbxts/roact";
import { HistoryEntry } from "../../../types";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Text } from "../interface/Text";

interface HistoryLineProps {
	data: HistoryEntry;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	order?: BindingOrValue<number>;
}

export function HistoryLine({ data, size, position, order }: HistoryLineProps) {
	const rem = useRem();
	const date = useMemo(() => {
		const dateTime = DateTime.fromUnixTimestamp(data.sentAt);
		return dateTime.FormatUniversalTime("LT", "en-us");
	}, [data]);

	return (
		<Group size={size} position={position} layoutOrder={order}>
			<Frame
				backgroundColor={palette.surface1}
				size={UDim2.fromOffset(rem(7), rem(1.5))}
				cornerRadius={new UDim(1, 0)}
			>
				<Text size={UDim2.fromScale(1, 1)} text={date} textColor={palette.white} textSize={rem(1.2)} />
			</Frame>

			<Text
				anchorPoint={new Vector2(1, 0)}
				size={new UDim2(1, -rem(7.5), 1, 0)}
				position={UDim2.fromScale(1, 0)}
				text={data.text}
				textSize={rem(1.5)}
				textColor={palette.white}
				textXAlignment="Left"
				font={fonts.inter.medium}
			/>
		</Group>
	);
}
