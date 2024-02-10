import { useEventListener } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, { useContext, useMemo, useState } from "@rbxts/roact";
import { GuiService, UserInputService } from "@rbxts/services";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { CommanderContext } from "../../providers/commanderProvider";
import { selectVisible } from "../../store/app";
import { Group } from "../interface/Group";
import { TerminalWindow } from "./TerminalWindow";
import { SuggestionList } from "./suggestion";

export default function Terminal() {
	const rem = useRem();
	const data = useContext(CommanderContext);
	const store = useStore();

	const visible = useSelector(selectVisible);

	const [isMouseOnGUI, setIsMouseOnGUI] = useState(false);

	const validKeys = useMemo(() => {
		return new Set(data.options.activationKeys);
	}, [data]);

	const mouseInputTypes = useMemo(() => {
		return new Set<Enum.UserInputType>([
			Enum.UserInputType.MouseButton1,
			Enum.UserInputType.MouseButton2,
			Enum.UserInputType.Touch,
		]);
	}, []);

	useEventListener(UserInputService.InputBegan, (input, gameProcessed) => {
		if (validKeys.has(input.KeyCode) && !gameProcessed) {
			store.setVisible(!visible);
		} else if (
			data.options.hideOnLostFocus &&
			mouseInputTypes.has(input.UserInputType) &&
			!isMouseOnGUI
		) {
			store.setVisible(false);
		}
	});

	return (
		<Group
			key="terminal"
			anchorPoint={new Vector2(0.5)}
			size={new UDim2(1, -rem(4), 0, rem(32))}
			position={new UDim2(0.5, 0, 0, rem(2) + GuiService.GetGuiInset()[0].Y)}
			visible={visible}
			event={{
				MouseEnter: () => setIsMouseOnGUI(true),
				MouseLeave: () => setIsMouseOnGUI(false),
			}}
		>
			<TerminalWindow key="window" />
			<SuggestionList key="suggestions" position={new UDim2(0, 0, 0, rem(6))} />

			<uilistlayout
				key="layout"
				Padding={new UDim(0, rem(1))}
				SortOrder={"LayoutOrder"}
			/>
		</Group>
	);
}
