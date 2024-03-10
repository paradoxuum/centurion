import { InterfaceOptions } from "../types";

export const DEFAULT_INTERFACE_OPTIONS: InterfaceOptions = {
	displayOrder: 1000,
	activationKeys: [Enum.KeyCode.F2],
	hideOnLostFocus: true,
	font: {
		regular: new Font("rbxassetid://16658221428"),
		medium: new Font("rbxassetid://16658221428", Enum.FontWeight.Medium),
		bold: new Font("rbxassetid://16658221428", Enum.FontWeight.Bold),
	},
};
