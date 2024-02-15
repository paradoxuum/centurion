import Roact, { useContext } from "@rbxts/roact";
import { GuiService } from "@rbxts/services";
import { usePx } from "../../hooks/usePx";
import { OptionsContext } from "../../providers/optionsProvider";
import { Group } from "../interface/Group";
import { TerminalWindow } from "./TerminalWindow";
import { SuggestionList } from "./suggestion";

export default function Terminal() {
	const px = usePx();
	const options = useContext(OptionsContext);

	return (
		<Group
			key="terminal"
			anchorPoint={options.anchorPoint ?? new Vector2(0.5)}
			size={options.size ?? new UDim2(1, -px(4), 0, px(32))}
			position={
				options.position ??
				new UDim2(0.5, 0, 0, px(32) + GuiService.GetGuiInset()[0].Y)
			}
		>
			<TerminalWindow key="window" />
			<SuggestionList key="suggestions" position={new UDim2(0, 0, 0, px(96))} />

			<uilistlayout
				key="layout"
				Padding={new UDim(0, px(1))}
				SortOrder={"LayoutOrder"}
			/>
		</Group>
	);
}
