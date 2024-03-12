import { useEventListener } from "@rbxts/pretty-react-hooks";
import React, { useContext, useMemo } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { UserInputService } from "@rbxts/services";
import { Layer } from "../components/interface/Layer";
import Terminal from "../components/terminal/Terminal";
import { OptionsContext } from "../providers/optionsProvider";
import { store } from "../store";
import { selectVisible } from "../store/app";

export function TerminalApp() {
	const options = useContext(OptionsContext);
	const visible = useSelector(selectVisible);

	const validKeys = useMemo(() => {
		return new Set(options.activationKeys);
	}, [options]);

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
			options.hideOnLostFocus &&
			mouseInputTypes.has(input.UserInputType) &&
			!options.isMouseOnGUI
		) {
			store.setVisible(false);
		}
	});

	return (
		<Layer displayOrder={options.displayOrder} visible={visible}>
			<Terminal />
		</Layer>
	);
}
