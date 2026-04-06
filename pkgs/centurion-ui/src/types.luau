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
	font: Font,
	icon: string,
	transparency: number,
	format_date: (log: Log) -> string,
	max_suggestions: number,

	text_size: number,
	subtext_size: number,

	anchor: Vector2,
	width: UDim,
	position: UDim2,
}

export type Theme = {
	background: Color3,
	surface: Color3,
	text: Color3,
	subtext: Color3,
	highlight: Color3,
	success: Color3,
	error: Color3,
}

export type AnalysisSuggestion = {
	name: string,
	description: string?,

	span: vector,
	replace: string,
}

export type AnalysisArgument = {
	text: string,
	index: number,
	type: string,
	kind: "single" | "list",
}

export type AnalysisResult = {
	result: centurion.Result,
	command: string?,
	argument: AnalysisArgument?,
	suggestions: { AnalysisSuggestion },
}

export type Log = {
	command: string,
	response: centurion.Response,
}

export type TextStyle = "normal" | "error" | "subtext" | "bg"

return nil
