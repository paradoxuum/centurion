import { BindingOrValue } from "@rbxts/pretty-react-hooks";
import Roact, { Binding, useContext } from "@rbxts/roact";
import { fonts } from "../../../constants/fonts";
import { palette } from "../../../constants/palette";
import { useMotion } from "../../../hooks/useMotion";
import { useRem } from "../../../hooks/useRem";
import { OptionsContext } from "../../../providers/optionsProvider";
import { ArgumentSuggestion, Suggestion } from "../../../types";
import { Frame } from "../../interface/Frame";
import { Padding } from "../../interface/Padding";
import { Text } from "../../interface/Text";
import { Badge } from "./Badge";
import { SuggestionTextBounds } from "./types";
import { highlightMatching } from "./util";

export interface MainSuggestionProps {
	suggestion?: Suggestion;
	argument: BindingOrValue<boolean>;
	currentText?: string;
	size: BindingOrValue<UDim2>;
	sizes: Binding<SuggestionTextBounds>;
}

export function MainSuggestion({
	suggestion,
	currentText,
	size,
	sizes,
	argument,
}: MainSuggestionProps) {
	const rem = useRem();
	const options = useContext(OptionsContext);

	const [badgeWidth, badgeWidthMotion] = useMotion(0);

	return (
		<Frame
			size={size}
			backgroundColor={palette.crust}
			cornerRadius={new UDim(0, rem(0.5))}
			clipsDescendants={true}
			event={{
				MouseEnter: () => options.setMouseOnGUI(true),
				MouseLeave: () => options.setMouseOnGUI(false),
			}}
		>
			<Padding key="padding" all={new UDim(0, rem(1))} />

			<Badge
				key="type-badge"
				anchorPoint={new Vector2(1, 0)}
				size={badgeWidth.map((width) =>
					UDim2.fromOffset(math.round(width), rem(2)),
				)}
				position={UDim2.fromScale(1, 0)}
				color={palette.lavender}
				text={
					argument && suggestion !== undefined
						? (suggestion.main as ArgumentSuggestion).dataType
						: ""
				}
				textColor={palette.surface0}
				textSize={rem(1.5)}
				visible={argument}
				onTextBoundsChange={(textBounds) =>
					badgeWidthMotion.spring(textBounds.X + rem(1), {
						mass: 0.5,
						tension: 400,
					})
				}
			/>

			<Text
				key="title"
				size={sizes.map((val) => val.title)}
				text={
					argument
						? suggestion?.main.title
						: highlightMatching(suggestion?.main.title, currentText)
				}
				textSize={rem(2)}
				textColor={palette.text}
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
				textColor={palette.subtext0}
				textXAlignment="Left"
				textWrapped={true}
				richText={true}
			/>

			<Text
				key="error"
				anchorPoint={new Vector2(0, 1)}
				size={sizes.map((val) => new UDim2(1, 0, 0, val.errorTextHeight))}
				position={UDim2.fromScale(0, 1)}
				text={
					argument && suggestion !== undefined
						? (suggestion.main as ArgumentSuggestion).error ?? ""
						: ""
				}
				textColor={palette.red}
				textSize={rem(1.5)}
				textWrapped={true}
				textXAlignment="Left"
			/>
		</Frame>
	);
}
