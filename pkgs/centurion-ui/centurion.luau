local centurion = require("../centurion/src")

export type Argument = centurion.Argument
export type ArgumentRange = centurion.ArgumentRange
export type Command<T...> = centurion.Command<T...>
export type Response = centurion.Response
export type Result<T = unknown> = centurion.Result<T>
export type Suggestion = centurion.Suggestion
export type SuggestionData = centurion.SuggestionData
export type SuggestionList = centurion.SuggestionList
export type Token = centurion.Token

return centurion
