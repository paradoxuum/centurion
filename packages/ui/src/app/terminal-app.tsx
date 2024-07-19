import { UserInputService } from "@rbxts/services";
import Vide, { derive } from "@rbxts/vide";
import Terminal from "../components/terminal";
import { Layer } from "../components/ui/layer";
import { useAtom } from "../hooks/use-atom";
import { useEvent } from "../hooks/use-event";
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

export function TerminalApp() {
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
			<Terminal />
		</Layer>
	);
}
