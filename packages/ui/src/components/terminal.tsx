import { GuiService } from "@rbxts/services";
import Vide from "@rbxts/vide";
import { useAtom } from "../hooks/use-atom";
import { px } from "../hooks/use-px";
import { interfaceOptions } from "../store";
import { Suggestions } from "./suggestions";
import { TerminalWindow } from "./terminal-window";
import { Group } from "./ui/group";

export default function Terminal() {
	const options = useAtom(interfaceOptions);

	return (
		<Group
			anchorPoint={() => options().anchorPoint ?? new Vector2(0, 0)}
			size={() => options().size ?? new UDim2(0, px(1024), 1, 0)}
			position={() =>
				options().position ??
				UDim2.fromOffset(px(16), px(8) + GuiService.GetGuiInset()[0].Y)
			}
		>
			<TerminalWindow />
			<Suggestions />

			<uilistlayout Padding={new UDim(0, px(8))} SortOrder={"LayoutOrder"} />
		</Group>
	);
}
