local centurion = require(script.Parent.Parent.centurion.src)

export type Argument = centurion.Argument
export type Command<T...> = centurion.Command<T...>
export type Response = centurion.Response
export type Result<T = unknown> = centurion.Result<T>
export type Token = centurion.Token

return centurion
