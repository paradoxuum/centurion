import { useEventListener } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, { useContext, useMemo } from "@rbxts/roact";
import { GuiService, UserInputService } from "@rbxts/services";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { CommanderContext } from "../../providers/commanderProvider";
import { OptionsContext } from "../../providers/optionsProvider";
import { selectVisible } from "../../store/app";
import { Group } from "../interface/Group";
import { TerminalWindow } from "./TerminalWindow";
import { SuggestionList } from "./suggestion";

export default function Terminal() {
	const rem = useRem();
	const data = useContext(CommanderContext);
	const options = useContext(OptionsContext);
	const store = useStore();

	const visible = useSelector(selectVisible);

	const validKeys = useMemo(() => {
		return new Set(data.options.activationKeys);
	}, [data]);

	useEventListener(UserInputService.InputBegan, (input, gameProcessed) => {
		if (gameProcessed || !validKeys.has(input.KeyCode)) return;
		store.setVisible(!visible);
	});

	return (
		<Group
			key="terminal"
			anchorPoint={options.anchorPoint ?? new Vector2(0.5)}
			size={options.size ?? new UDim2(1, -rem(4), 0, rem(32))}
			position={
				options.position ??
				new UDim2(0.5, 0, 0, rem(2) + GuiService.GetGuiInset()[0].Y)
			}
			visible={visible}
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
