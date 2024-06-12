import { t } from "@rbxts/t";
import { CommandShortcut, ShortcutContext } from "../shared";

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

export function getShortcutKeycodes(shortcut: CommandShortcut): Enum.KeyCode[] {
	if (isKeyCode(shortcut)) {
		return [shortcut];
	}

	if (isKeyCodeArray(shortcut)) {
		return shortcut;
	}

	if (isShortcutContext(shortcut)) {
		return shortcut.keys;
	}

	return [];
}

export const isKeyCode = t.enum(Enum.KeyCode);
export const isKeyCodeArray = t.array(isKeyCode);
export const isShortcutContext: t.check<ShortcutContext> = t.strictInterface({
	keys: isKeyCodeArray,
	arguments: t.optional(t.array(t.string)),
});
