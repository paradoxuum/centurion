import { CenturionClient } from "@rbxts/centurion";
import { UserInputService } from "@rbxts/services";
import Vide, { derive } from "@rbxts/vide";
import { read } from "@rbxts/vide";
import { Suggestions, Terminal } from "../components";
import { Group } from "../components/ui/group";
import { Layer } from "../components/ui/layer";
import { useClient } from "../hooks/use-client";
import { useEvent } from "../hooks/use-event";
import { px, usePx } from "../hooks/use-px";
import { mouseOverInterface, options, visible } from "../store";

const MOUSE_INPUT_TYPES = new Set<Enum.UserInputType>([
	Enum.UserInputType.MouseButton1,
	Enum.UserInputType.MouseButton2,
	Enum.UserInputType.Touch,
]);

export function CenturionApp(client: CenturionClient) {
	useClient(client);
	usePx();

	const validKeys = derive(() => new Set(read(options().activationKeys)));

	useEvent(UserInputService.InputBegan, (input, gameProcessed) => {
		if (validKeys().has(input.KeyCode) && !gameProcessed) {
			visible(!visible());
		} else if (
			read(options().hideOnLostFocus) &&
			MOUSE_INPUT_TYPES.has(input.UserInputType) &&
			!mouseOverInterface()
		) {
			visible(false);
		}
	});

	return (
		<Layer
			name="Centurion"
			displayOrder={() => read(options().displayOrder)}
			visible={visible}
		>
			<Group
				anchor={() => read(options().anchor)}
				size={() => read(options().size)}
				position={() => read(options().position)}
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
