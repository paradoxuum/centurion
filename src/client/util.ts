const key = Enum.KeyCode;
const modifierKeys = new Map<Enum.KeyCode, string>([
	[key.LeftAlt, "Alt"],
	[key.RightAlt, "Alt"],
	[key.LeftControl, "Ctrl"],
	[key.RightControl, "Ctrl"],
	[key.LeftShift, "Shift"],
	[key.RightShift, "Shift"],
	[key.LeftMeta, "Meta"],
	[key.RightMeta, "Meta"],
]);

export function isModifierKey(keyCode: Enum.KeyCode) {
	return modifierKeys.has(keyCode);
}

export function getModifierKeyName(keyCode: Enum.KeyCode) {
	return modifierKeys.get(keyCode);
}
