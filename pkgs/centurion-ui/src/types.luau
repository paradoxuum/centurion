local centurion = require("../centurion")
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

export type AnalysisSuggestion = {
	name: string,
	description: string?,

	token: vector,
	replace: string,
}

export type AnalysisArgument = {
	name: string,
	type: string,
	optional: boolean,
	description: string?,

	input: { vector },
}

export type AnalysisResult = {
	result: centurion.Result,
	command: string?,
	argument: number?,
	arguments: { string }?,
	suggestions: { AnalysisSuggestion },
}

return nil
