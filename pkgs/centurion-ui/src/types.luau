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
	visible_suggestions: number,
	max_suggestions: number,
	clear_button: boolean,

	text_size: number,
	subtext_size: number,

	anchor: Vector2,
	width: UDim,
	position: UDim2,
	display_order: number,
}

export type OptionsPartial = {
	hide_on_lost_focus: boolean?,
	activation_keys: { Enum.KeyCode }?,
	theme: Theme?,
	font: Font?,
	icon: string?,
	transparency: number?,
	format_date: ((log: Log) -> string)?,
	visible_suggestions: number?,
	max_suggestions: number?,
	clear_button: boolean?,

	text_size: number?,
	subtext_size: number?,

	anchor: Vector2?,
	width: UDim?,
	position: UDim2?,
	display_order: number?,
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
	kind: "command" | "argument",
	name: string,
	description: string?,
	-- ranges of `name` that match the input
	matches: { vector },

	span: vector,
	replace: string,
}

export type AnalysisArgument = {
	index: number,
	type: string,
	kind: "single" | "list",
}

export type AnalysisResult = {
	result: centurion.Result<unknown>,
	command: string?,
	argument: AnalysisArgument?,
	suggestions: { AnalysisSuggestion },
	-- matches left out by the suggestion limit
	hidden_suggestions: number?,
}

export type Log = {
	command: string,
	response: centurion.Response,
}

export type TextStyle = "normal" | "error" | "subtext" | "bg" | "highlight"

return nil
