import { mapBinding } from "@rbxts/pretty-react-hooks";
import Roact, { useCallback, useContext, useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { slice } from "@rbxts/sift/out/Array";
import { SuggestionData } from "../../../types";
import { fonts } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { springs } from "../../constants/springs";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { DataContext } from "../../providers/dataProvider";
import { toHex } from "../../util/color";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Padding } from "../interface/Padding";
import { Shadow } from "../interface/Shadow";
import { Text } from "../interface/Text";

export interface SuggestionListProps {
	position?: UDim2;
}

const HIGHLIGHT_PREFIX = `<font color="${toHex(palette.blue)}">`;

export function SuggestionList({ position }: SuggestionListProps) {
	const rem = useRem();
	const data = useContext(DataContext);

	const getHighlightedName = useCallback((fieldText: string, text?: string) => {
		const formattedText = text?.sub(0, fieldText.size());
		if (formattedText === undefined || fieldText !== formattedText) {
			return text;
		}

		return HIGHLIGHT_PREFIX + formattedText + "</font>" + text!.sub(fieldText.size() + 1);
	}, []);

	// Get top suggestion and other suggestions
	const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
	const topSuggestion = useMemo(() => {
		return suggestions.size() > 0 ? suggestions[0] : undefined;
	}, [suggestions]);
	const otherSuggestions = useMemo(() => {
		const maxIndex = math.min(suggestions.size(), 4);
		return suggestions.size() > 1 ? slice(suggestions, 2, maxIndex) : undefined;
	}, [suggestions]);

	// Top size bindings
	const [topSizes, setTopSizes] = useState({
		title: UDim2.fromOffset(rem(16), rem(2)),
		description: UDim2.fromOffset(rem(16), rem(2)),
	});
	const topSizeBinding = useMemo(() => {
		return mapBinding(topSizes, ({ title, description }) => {
			return new UDim2(1, 0, 0, title.Y.Offset + description.Y.Offset + rem(2));
		});
	}, [topSizes, rem]);

	// Window size bindings
	const [windowSize, windowSizeMotion] = useMotion({
		x: 0,
		y: 0,
	});
	const windowSizeBinding = useMemo(() => {
		return windowSize.map(({ x, y }) => {
			return UDim2.fromOffset(math.round(x), math.round(y));
		});
	}, []);

	// Get suggestions
	useEffect(() => {
		if (data.text === "") {
			setSuggestions([]);
			return;
		}

		setSuggestions(data.getCommandSuggestions(data.text));
	}, [data]);

	// Resize window based on suggestions
	useEffect(() => {
		const titleBounds =
			topSuggestion !== undefined
				? TextService.GetTextSize(topSuggestion.title, rem(2), "GothamMedium", new Vector2(rem(16), math.huge))
				: new Vector2();

		const descriptionBounds =
			topSuggestion !== undefined && topSuggestion.description !== undefined
				? TextService.GetTextSize(
						topSuggestion.description,
						rem(1.5),
						"GothamMedium",
						new Vector2(rem(16), math.huge),
				  )
				: new Vector2();

		setTopSizes({
			title: UDim2.fromOffset(titleBounds.X, titleBounds.Y),
			description: UDim2.fromOffset(descriptionBounds.X, descriptionBounds.Y),
		});

		const otherCount = otherSuggestions?.size();
		const otherSuggestionSize = otherCount !== undefined ? otherCount * rem(2) + (otherCount - 1) * rem(0.5) : 0;

		windowSizeMotion.spring(
			{
				x: math.max(titleBounds.X, descriptionBounds.X) + rem(2),
				y: titleBounds.Y + descriptionBounds.Y + rem(3) + otherSuggestionSize,
			},
			springs.gentle,
		);
	}, [suggestions, rem]);

	return (
		<Group size={windowSizeBinding} position={position} clipsDescendants={true} visible={suggestions.size() > 0}>
			<Frame key="top" size={topSizeBinding} backgroundColor={palette.crust} cornerRadius={new UDim(0, rem(0.5))}>
				<Padding key="padding" all={new UDim(0, rem(1))} />

				<Text
					key="title"
					size={topSizes.title}
					text={getHighlightedName(data.text, topSuggestion?.title)}
					textSize={rem(2)}
					textColor={palette.white}
					textXAlignment="Left"
					richText={true}
					font={fonts.inter.bold}
				/>

				<Text
					key="description"
					size={topSizes.description}
					position={UDim2.fromOffset(0, rem(2))}
					text={topSuggestion?.description}
					textSize={rem(1.5)}
					textColor={palette.white}
					textXAlignment="Left"
					textWrapped={true}
					richText={true}
				/>

				<Shadow />
			</Frame>

			<Group
				key="other"
				size={mapBinding(otherSuggestions, (val) => {
					return new UDim2(1, 0, 0, (val?.size() ?? 0) * rem(2));
				})}
			>
				<uilistlayout key="layout" SortOrder="LayoutOrder" Padding={new UDim(0, rem(0.5))} />

				{otherSuggestions?.map((suggestion) => {
					return (
						<Frame
							size={new UDim2(1, 0, 0, rem(2))}
							backgroundColor={palette.mantle}
							cornerRadius={new UDim(0, rem(0.5))}
						>
							<Padding all={new UDim(0, rem(0.5))} />

							<Text
								size={new UDim2(1, 0, 0, rem(1.5))}
								text={getHighlightedName(data.text, suggestion.title)}
								textColor={palette.white}
								textSize={rem(1.6)}
								textXAlignment="Left"
								richText={true}
							/>
						</Frame>
					);
				})}
			</Group>

			<uilistlayout key="layout" SortOrder="LayoutOrder" Padding={new UDim(0, rem(0.5))} />
		</Group>
	);
}
