import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { Binding } from "@rbxts/roact";
import { fonts } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { useRem } from "../../../hooks/useRem";
import { ArgumentSuggestion, Suggestion } from "../../../types";
import { Frame } from "../../interface/Frame";
import { Group } from "../../interface/Group";
import { Padding } from "../../interface/Padding";
import { Text } from "../../interface/Text";
import { Badge } from "./Badge";
import { SuggestionSizes } from "./types";
import { highlightMatching } from "./util";

export interface MainSuggestionProps {
	suggestion?: Suggestion;
	argument: BindingOrValue<boolean>;
	currentText?: string;
	size: BindingOrValue<UDim2>;
	sizes: Binding<SuggestionSizes>;
}

export function MainSuggestion({
	suggestion,
	currentText,
	size,
	sizes,
	argument,
}: MainSuggestionProps) {
	const rem = useRem();

	return (
		<Frame
			size={size}
			backgroundColor={palette.crust}
			cornerRadius={new UDim(0, rem(0.5))}
			clipsDescendants={true}
		>
			<Padding key="padding" all={new UDim(0, rem(1))} />

			<Group
				key="badges"
				anchorPoint={new Vector2(1, 0)}
				size={sizes.map((val) =>
					UDim2.fromOffset(math.max(val.typeBadgeWidth, rem(7)), rem(4.5)),
				)}
				position={UDim2.fromScale(1, 0)}
				visible={argument}
			>
				<Badge
					key="optional-badge"
					size={new UDim2(1, 0, 0, rem(2))}
					color={
						argument &&
						suggestion !== undefined &&
						(suggestion.main as ArgumentSuggestion).optional
							? palette.blue
							: palette.red
					}
					text={
						argument &&
						suggestion !== undefined &&
						(suggestion.main as ArgumentSuggestion).optional
							? "Optional"
							: "Required"
					}
					textColor={palette.white}
					textSize={rem(1.5)}
				/>

				<Badge
					key="type-badge"
					size={new UDim2(1, 0, 0, rem(2))}
					position={UDim2.fromOffset(0, rem(2.5))}
					color={palette.surface0}
					text={
						argument && suggestion !== undefined
							? (suggestion.main as ArgumentSuggestion).dataType
							: ""
					}
					textColor={palette.white}
					textSize={rem(1.5)}
				/>
			</Group>

			<Text
				key="title"
				size={sizes.map((val) => val.title)}
				text={
					argument
						? suggestion?.main.title
						: highlightMatching(suggestion?.main.title, currentText)
				}
				textSize={rem(2)}
				textColor={palette.white}
				textXAlignment="Left"
				richText={true}
				font={fonts.inter.bold}
			/>

			<Text
				key="description"
				size={sizes.map((val) => val.description)}
				position={UDim2.fromOffset(0, rem(2))}
				text={suggestion?.main.description ?? ""}
				textSize={rem(1.5)}
				textColor={palette.white}
				textXAlignment="Left"
				textWrapped={true}
				richText={true}
			/>
		</Frame>
	);
}
