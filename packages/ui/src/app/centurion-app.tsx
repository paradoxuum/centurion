import { CenturionClient } from "@rbxts/centurion";
import { UserInputService } from "@rbxts/services";
import Vide, { derive } from "@rbxts/vide";
import { Suggestions, Terminal } from "../components";
import { Group } from "../components/ui/group";
import { Layer } from "../components/ui/layer";
import { useAtom } from "../hooks/use-atom";
import { useClient } from "../hooks/use-client";
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

export function CenturionApp(client: CenturionClient) {
	useClient(client);
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
		<Layer displayOrder={() => options().displayOrder} visible={visible}>
			<Group
				anchorPoint={() => options().anchorPoint}
				size={() => {
					const size = options().size;
					return typeIs(size, "UDim2") ? size : size(px);
				}}
				position={() => {
					const position = options().position;
					return typeIs(position, "UDim2") ? position : position(px);
				}}
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
