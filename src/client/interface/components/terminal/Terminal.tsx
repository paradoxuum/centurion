import Roact, { useContext } from "@rbxts/roact";
import { GuiService } from "@rbxts/services";
import { usePx } from "../../hooks/usePx";
import { OptionsContext } from "../../providers/optionsProvider";
import { Group } from "../interface/Group";
import { TerminalWindow } from "./TerminalWindow";
import { Suggestions } from "./suggestions";

export default function Terminal() {
	const px = usePx();
	const options = useContext(OptionsContext);

	return (
		<Group
			key="terminal"
			anchorPoint={options.anchorPoint ?? new Vector2(0, 0)}
			size={options.size ?? new UDim2(0, px(1024), 1, 0)}
			position={
				options.position ??
				UDim2.fromOffset(px(16), px(16) + GuiService.GetGuiInset()[0].Y)
			}
		>
			<TerminalWindow key="window" />
			<Suggestions key="suggestions" />

			<uilistlayout
				key="layout"
				Padding={new UDim(0, px(8))}
				SortOrder={"LayoutOrder"}
			/>
		</Group>
	);
}
