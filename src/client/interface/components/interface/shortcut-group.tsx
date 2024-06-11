import React, { useContext, useState } from "@rbxts/react";
import { Shortcut } from "../../../../shared";
import { usePx } from "../../hooks/use-px";
import {
	InterfaceOptionsWithState,
	OptionsContext,
} from "../../providers/options-provider";
import { Badge } from "../terminal/suggestions/badge";
import { Frame } from "./frame";
import { Padding } from "./padding";
import { Text } from "./text";

function isModifierKey(key: Enum.KeyCode) {
	switch (key) {
		case Enum.KeyCode.LeftAlt:
			return true;
		case Enum.KeyCode.RightAlt:
			return true;
		case Enum.KeyCode.LeftControl:
			return true;
		case Enum.KeyCode.RightControl:
			return true;
		case Enum.KeyCode.LeftShift:
			return true;
		case Enum.KeyCode.RightShift:
			return true;
		case Enum.KeyCode.LeftMeta:
			return true;
		case Enum.KeyCode.RightMeta:
			return true;
		default:
			return false;
	}
}

function transformModifierKeyName(keyName: string) {
	switch (keyName) {
		case "LeftAlt":
			return "Alt";
		case "RightAlt":
			return "Alt";
		case "LeftControl":
			return "Ctrl";
		case "RightControl":
			return "Ctrl";
		case "LeftShift":
			return "Shift";
		case "RightShift":
			return "Shift";
		default:
			break;
	}
}

interface KeyProps {
	options: InterfaceOptionsWithState;
	keyCode: Enum.KeyCode;
}

function Key(props: KeyProps) {
	const options = props.options;
	const isModifier = isModifierKey(props.keyCode);

	const [size, setSize] = useState(new UDim2(0, 24, 0, 24));

	return (
		<frame
			LayoutOrder={isModifier ? -1 : 0}
			AutomaticSize={"XY"}
			BackgroundTransparency={1}
		>
			<Badge
				color={isModifier ? options.palette.highlight : options.palette.surface}
				text={
					isModifier
						? transformModifierKeyName(props.keyCode.Name)
						: props.keyCode.Name
				}
				textColor={isModifier ? options.palette.surface : options.palette.text}
				textSize={16}
				size={size}
				onTextBoundsChange={(textBounds) => {
					setSize(new UDim2(0, math.max(24, textBounds.X + 6), 0, 24));
				}}
			>
				{isModifier ? (
					<uistroke Color={options.palette.highlight} Thickness={2} />
				) : (
					<></>
				)}
			</Badge>
		</frame>
	);
}

interface ShortcutGroupProps {
	shortcuts?: Shortcut;
}
export function ShortcutGroup(props: ShortcutGroupProps) {
	const options = useContext(OptionsContext);
	const px = usePx();

	return (
		<frame
			BackgroundTransparency={options.backgroundTransparency}
			BackgroundColor3={options.palette.background}
			Size={new UDim2(1, 0, 1, 0)}
			Position={new UDim2(1, px(16), 0, -px(8))}
			AutomaticSize={"XY"}
		>
			<uicorner CornerRadius={new UDim(0, px(8))} />
			<Padding all={new UDim(0, px(8))} />
			<uilistlayout
				HorizontalAlignment={"Left"}
				FillDirection={"Vertical"}
				Padding={new UDim(0, 8)}
			/>
			{props.shortcuts?.map((shortcut, index) => {
				if (typeIs(shortcut, "table")) {
					return (
						<frame
							BackgroundTransparency={1}
							AutomaticSize={"XY"}
							key={`shortcut-${
								// biome-ignore lint/suspicious/noArrayIndexKey: Easiest way I've found to ensure each key is unique
								index
							}`}
						>
							<uilistlayout
								FillDirection={"Horizontal"}
								SortOrder={"LayoutOrder"}
								Padding={new UDim(0, 8)}
							/>
							{(shortcut as Enum.KeyCode[]).map((key) => {
								return (
									<Key options={options} keyCode={key} key={key.Name.lower()} />
								);
							})}
						</frame>
					);
					// biome-ignore lint/style/noUselessElse: Biome misdiagnoses this as useless
				} else if (typeIs(shortcut, "Enum")) {
					return (
						<frame
							BackgroundTransparency={1}
							AutomaticSize={"XY"}
							key={`shortcut-${
								// biome-ignore lint/suspicious/noArrayIndexKey: Easiest way I've found to ensure each key is unique
								index
							}`}
						>
							<Key options={options} keyCode={shortcut as unknown as Enum.KeyCode} />
						</frame>
					);
				}
			})}
		</frame>
	);
}
