import React, { useContext } from "@rbxts/react";
import { GuiService } from "@rbxts/services";
import { usePx } from "../hooks/use-px";
import { OptionsContext } from "../providers/options-provider";
import { Suggestions } from "./suggestions";
import { TerminalWindow } from "./terminal-window";
import { Group } from "./ui/group";

export default function Terminal() {
	const px = usePx();
	const options = useContext(OptionsContext);

	return (
		<Group
			anchorPoint={options.anchorPoint ?? new Vector2(0, 0)}
			size={options.size ?? new UDim2(0, px(1024), 1, 0)}
			position={
				options.position ??
				UDim2.fromOffset(px(16), px(8) + GuiService.GetGuiInset()[0].Y)
			}
		>
			<TerminalWindow />
			<Suggestions />

			<uilistlayout Padding={new UDim(0, px(8))} SortOrder={"LayoutOrder"} />
		</Group>
	);
}
