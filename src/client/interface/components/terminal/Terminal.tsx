import Roact from "@rbxts/roact";
import { GuiService } from "@rbxts/services";
import { useRem } from "../../hooks/useRem";
import { Group } from "../interface/Group";
import { TerminalWindow } from "./TerminalWindow";
import { SuggestionList } from "./suggestion";

export default function Terminal() {
	const rem = useRem();

	return (
		<Group
			key="terminal"
			anchorPoint={new Vector2(0.5)}
			size={new UDim2(1, -rem(4), 0, rem(32))}
			position={new UDim2(0.5, 0, 0, rem(2) + GuiService.GetGuiInset()[0].Y)}
		>
			<TerminalWindow key="window" />
			<SuggestionList key="suggestions" position={new UDim2(0, 0, 0, rem(6))} />

			<uilistlayout key="layout" Padding={new UDim(0, rem(1))} SortOrder={"LayoutOrder"} />
		</Group>
	);
}
