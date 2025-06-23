import { CenturionClient } from "@rbxts/centurion";
import { splitString } from "@rbxts/centurion/out/shared/util/string";
import { UserInputService } from "@rbxts/services";
import Vide, { derive } from "@rbxts/vide";
import { Suggestions, Terminal } from "../components";
import { Group } from "../components/ui/group";
import { Layer } from "../components/ui/layer";
import { useClient } from "../hooks/use-client";
import { useEvent } from "../hooks/use-event";
import { px, usePx } from "../hooks/use-px";
import { mouseOverInterface, options, terminalText, visible } from "../store";

const MOUSE_INPUT_TYPES = new Set<Enum.UserInputType>([
	Enum.UserInputType.MouseButton1,
	Enum.UserInputType.MouseButton2,
	Enum.UserInputType.Touch,
]);

export function CenturionApp(client: CenturionClient) {
	useClient(client);
	usePx();

	const validKeys = derive(() => new Set(options().activationKeys));
	const terminalTextParts = derive(() => {
		return splitString(terminalText(), " ", true);
	});

	useEvent(UserInputService.InputBegan, (input, gameProcessed) => {
		if (validKeys().has(input.KeyCode) && !gameProcessed) {
			visible(!visible());
		} else if (
			options().hideOnLostFocus &&
			MOUSE_INPUT_TYPES.has(input.UserInputType) &&
			!mouseOverInterface()
		) {
			visible(false);
		}
	});

	return (
		<Layer
			name="Centurion"
			displayOrder={() => options().displayOrder}
			visible={visible}
		>
			<Group
				anchor={() => options().anchor}
				size={() => {
					const size = options().size;
					return typeIs(size, "UDim2") ? size : size(px);
				}}
				position={() => {
					const position = options().position;
					return typeIs(position, "UDim2") ? position : position(px);
				}}
			>
				<Terminal textParts={terminalTextParts} />
				<Suggestions textParts={terminalTextParts} />

				<uilistlayout
					Padding={() => new UDim(0, px(8))}
					SortOrder={"LayoutOrder"}
				/>
			</Group>
		</Layer>
	);
}
