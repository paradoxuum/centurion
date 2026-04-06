export type Command<T...> = {
	callback: (ctx: ExecutionContext, T...) -> any,
	description: string?,
	arguments: () -> T...,
	guards: { string | Guard }?,
	roles: { string }?,
	permissions: { string }?,
}

export type Argument = {
	name: string,
	type: string,
	optional: boolean?,
	description: string?,
	num_args: (number | "rest")?,
	suggestions: { string }?,
}

export type SingleArgumentType = {
	kind: "single",
	transform: (text: string, executor: Player) -> Result,
	suggestions: ((text: string, executor: Player) -> { string })?,
}

export type ListArgumentType = {
	kind: "list",
	transform: (text: { string }, executor: Player) -> Result,
	suggestions: ((text: string, executor: Player) -> { string })?,
}

export type ArgumentType = SingleArgumentType | ListArgumentType

export type ArgumentFn<T> = (name: string, description: string?, suggestions: { string }?) -> T

export type ExecutionContext = {
	executor: Player,
	command: string,
	input: string,
	arguments: { string },
	response: Response?,

	reply: (message: string) -> (),
	error: (message: string) -> (),
}

export type Guard = (context: ExecutionContext) -> boolean

export type Response = {
	success: boolean,
	message: string,
	timestamp: number,
}

export type Ok = {
	success: true,
	value: any,
}

export type Err = {
	success: false,
	error: string,
}

export type Result = Ok | Err

export type CommandMap = { [string]: Command<unknown> }

export type PermissionRole = {
	name: string,
	priority: number,
	permissions: { [string]: boolean },
}

return nil
