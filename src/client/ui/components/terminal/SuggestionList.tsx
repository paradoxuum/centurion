import { BindingOrValue, getBindingValue } from "@rbxts/pretty-react-hooks";
import Roact, { useEffect, useRef, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { springs } from "../../constants/springs";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { SuggestionData } from "../../types/suggestion";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Padding } from "../interface/Padding";
import { Shadow } from "../interface/Shadow";
import { Text } from "../interface/Text";

export interface SuggestionListProps {
	position?: UDim2;
	suggestions: BindingOrValue<SuggestionData[]>;
}

export function SuggestionList({ position, suggestions }: SuggestionListProps) {
	const rem = useRem();
	const suggestionsValue = getBindingValue(suggestions);

	const topSuggestion = useRef<SuggestionData>();
	const [titleSize, setTitleSize] = useState(new Vector2(rem(16), rem(2)));
	const [descriptionSize, setDescriptionSize] = useState(new Vector2(rem(16), rem(2)));
	const [topSuggestionSize, topSuggestionSizeMotion] = useMotion({
		x: rem(1),
		y: rem(1),
	});

	useEffect(() => {
		topSuggestion.current = getBindingValue(suggestions)[0];
	}, [suggestions]);

	useEffect(() => {
		if (topSuggestion.current === undefined) {
			return;
		}

		const titleBounds = TextService.GetTextSize(
			topSuggestion.current.title,
			rem(1.5),
			"GothamMedium",
			new Vector2(rem(16), math.huge),
		);

		let totalSizeX = titleBounds.X;
		let totalSizeY = titleBounds.Y;

		if (topSuggestion.current.description !== undefined) {
			const descriptionBounds = TextService.GetTextSize(
				topSuggestion.current.description,
				rem(1.5),
				"GothamMedium",
				new Vector2(rem(16), math.huge),
			);

			setDescriptionSize(descriptionBounds);
			totalSizeX = math.max(totalSizeX, descriptionBounds.X);
			totalSizeY += descriptionBounds.Y;
		}

		setTitleSize(titleBounds);
		topSuggestionSizeMotion.spring(
			{
				// Account for padding by adding 1 rem
				x: totalSizeX + rem(1),
				y: totalSizeY + rem(1),
			},
			springs.responsive,
		);
	}, [topSuggestion]);

	return (
		<Group
			size={topSuggestionSize.map(({ x, y }) => UDim2.fromOffset(x, y))}
			position={position}
			clipsDescendants={true}
			visible={suggestionsValue.size() > 0}
		>
			<Frame size={UDim2.fromScale(1, 1)} backgroundColor={palette.crust} cornerRadius={new UDim(0, rem(0.5))}>
				<Padding all={new UDim(0, rem(1))} />

				{topSuggestion.current !== undefined && (
					<>
						<Text
							size={new UDim2(1, 0, 0, rem(2))}
							text={topSuggestion.current.title}
							textSize={rem(2)}
							textColor={palette.white}
							textXAlignment="Left"
							font={fonts.inter.bold}
						/>

						<Text
							size={UDim2.fromOffset(descriptionSize.X, descriptionSize.Y)}
							position={UDim2.fromOffset(0, rem(2))}
							text={topSuggestion.current.description}
							textSize={rem(1.5)}
							textColor={palette.white}
							textXAlignment="Left"
							textWrapped={true}
						/>
					</>
				)}
			</Frame>

			<Shadow />
		</Group>
	);
}
