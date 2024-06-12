import React, { useContext, useState } from "@rbxts/react";
import { CommandShortcut } from "../../../../shared";
import {
	getModifierKeyName,
	getShortcutKeycodes,
	isModifierKey,
} from "../../../util";
import { usePx } from "../../hooks/use-px";
import {
	InterfaceOptionsWithState,
	OptionsContext,
} from "../../providers/options-provider";
import { Badge } from "../terminal/suggestions/badge";
import { Frame } from "./frame";
import { Padding } from "./padding";

interface KeyProps {
	options: InterfaceOptionsWithState;
	keyCode: Enum.KeyCode;
}

function Key(props: KeyProps) {
	const options = props.options;
	const isModifier = isModifierKey(props.keyCode);

	const [size, setSize] = useState(new UDim2(0, 24, 0, 24));

	return (
		<Frame
			backgroundTransparency={1}
			layoutOrder={isModifier ? -1 : 0}
			automaticSize="XY"
		>
			<Badge
				color={isModifier ? options.palette.highlight : options.palette.surface}
				text={
					isModifier ? getModifierKeyName(props.keyCode) : props.keyCode.Name
				}
				textColor={isModifier ? options.palette.text : options.palette.text}
				textSize={16}
				size={size}
				onTextBoundsChange={(textBounds) => {
					setSize(new UDim2(0, math.max(24, textBounds.X + 12), 0, 24));
				}}
				backgroundTransparency={isModifier ? 0.5 : 0}
			>
				{isModifier ? (
					<uistroke Color={options.palette.highlight} Thickness={1} />
				) : (
					<uistroke Color={options.palette.subtext} Thickness={1} />
				)}
			</Badge>
		</Frame>
	);
}

interface ShortcutGroupProps {
	shortcuts?: CommandShortcut[];
}
export function ShortcutGroup(props: ShortcutGroupProps) {
	const options = useContext(OptionsContext);
	const px = usePx();

	return (
		<Frame
			backgroundTransparency={options.backgroundTransparency}
			backgroundColor={options.palette.background}
			size={new UDim2(1, 0, 1, 0)}
			position={new UDim2(1, px(16), 0, -px(8))}
			cornerRadius={new UDim(0, px(8))}
			automaticSize="XY"
		>
			<Padding all={new UDim(0, px(8))} />
			<uilistlayout
				HorizontalAlignment={"Left"}
				FillDirection={"Vertical"}
				Padding={new UDim(0, 8)}
			/>

			{props.shortcuts?.map((shortcut, index) => {
				const shortcuts = getShortcutKeycodes(shortcut);

				return (
					<Frame
						automaticSize="XY"
						backgroundTransparency={1}
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

						{shortcuts.map((key) => {
							return (
								<Key options={options} keyCode={key} key={key.Name.lower()} />
							);
						})}
					</Frame>
				);
			})}
		</Frame>
	);
}
