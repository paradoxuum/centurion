local centurion = require("../centurion")
export type Suggestion = {
	name: string,
	type: string,
	description: string?,
}

export type Options = {
	hide_on_lost_focus: boolean,
	activation_keys: { Enum.KeyCode },
	theme: Theme,
	icon: string,
	format_date: (log: Log) -> string,
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

	span: vector,
	replace: string,
}

export type AnalysisResult = {
	result: centurion.Result,
	command: string?,
	argument: number?,
	arguments: { string }?,
	suggestions: { AnalysisSuggestion },
}

export type Log = {
	command: string,
	response: centurion.Response,
}

export type TextStyle = "normal" | "error" | "subtext" | "bg"

return nil
