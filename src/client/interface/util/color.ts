export function toHex(color: Color3) {
	return string.format("#%02X%02X%02X", color.R * 0xff, color.G * 0xff, color.B * 0xff);
}
