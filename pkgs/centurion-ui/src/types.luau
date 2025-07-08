export type Suggestion = {
	name: string,
	type: string,
	description: string?,
}

export type Options = {
	hideOnLostFocus: boolean,
	activationKeys: { Enum.KeyCode },
}

export type Theme = {
	background: Color3,
	surface: Color3,
	text: Color3,
	subtext: Color3,
	highlight: Color3,
	success: Color3,
	error: Color3,
	font: Font,
}

return nil
