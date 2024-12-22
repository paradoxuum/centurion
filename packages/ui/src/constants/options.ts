import { GuiService } from "@rbxts/services";
import { px } from "../hooks/use-px";
import { DefaultPalette } from "../palette";
import { InterfaceOptions } from "../types";

export const DEFAULT_INTERFACE_OPTIONS: InterfaceOptions = {
	anchor: new Vector2(),
	position: () =>
		UDim2.fromOffset(px(16), px(8) + GuiService.GetGuiInset()[0].Y),
	size: () => new UDim2(0, px(1024), 1, 0),
	displayOrder: 1000,
	backgroundTransparency: 0.2,
	hideOnLostFocus: true,
	activationKeys: [Enum.KeyCode.F2],
	font: {
		regular: new Font("rbxassetid://16658221428"),
		medium: new Font("rbxassetid://16658221428", Enum.FontWeight.Medium),
		bold: new Font("rbxassetid://16658221428", Enum.FontWeight.Bold),
	},
	palette: DefaultPalette.mocha,
	autoLocalize: false,
};
