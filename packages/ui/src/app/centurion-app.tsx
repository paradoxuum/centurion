import { ClientAPI } from "@rbxts/centurion";
import { GuiService, UserInputService } from "@rbxts/services";
import Vide, { derive } from "@rbxts/vide";
import { Suggestions, Terminal } from "../components";
import { Group } from "../components/ui/group";
import { Layer } from "../components/ui/layer";
import { useAPI } from "../hooks/use-api";
import { useAtom } from "../hooks/use-atom";
import { useEvent } from "../hooks/use-event";
import { px, usePx } from "../hooks/use-px";
import {
	interfaceOptions,
	interfaceVisible,
	mouseOverInterface,
} from "../store";

const MOUSE_INPUT_TYPES = new Set<Enum.UserInputType>([
	Enum.UserInputType.MouseButton1,
	Enum.UserInputType.MouseButton2,
	Enum.UserInputType.Touch,
]);

export function CenturionApp(api: ClientAPI) {
	useAPI(api);
	usePx();

	const options = useAtom(interfaceOptions);
	const visible = useAtom(interfaceVisible);

	const validKeys = derive(() => new Set(options().activationKeys));

	useEvent(UserInputService.InputBegan, (input, gameProcessed) => {
		if (validKeys().has(input.KeyCode) && !gameProcessed) {
			interfaceVisible(!visible());
		} else if (
			options().hideOnLostFocus &&
			MOUSE_INPUT_TYPES.has(input.UserInputType) &&
			!mouseOverInterface()
		) {
			interfaceVisible(false);
		}
	});

	return (
		<Layer displayOrder={() => options().displayOrder ?? 0} visible={visible}>
			<Group
				anchorPoint={() => options().anchorPoint ?? new Vector2(0, 0)}
				size={() => options().size ?? new UDim2(0, px(1024), 1, 0)}
				position={() =>
					options().position ??
					UDim2.fromOffset(px(16), px(8) + GuiService.GetGuiInset()[0].Y)
				}
			>
				<Terminal />
				<Suggestions />

				<uilistlayout
					Padding={() => new UDim(0, px(8))}
					SortOrder={"LayoutOrder"}
				/>
			</Group>
		</Layer>
	);
}
