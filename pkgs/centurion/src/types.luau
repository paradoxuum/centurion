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

export type SingleArgumentType<T = unknown> = {
	kind: "single",
	transform: (text: string, executor: Player) -> Result<T>,
	suggestions: ((text: string, executor: Player) -> { string })?,
}

export type ListArgumentType<T = unknown> = {
	kind: "list",
	transform: (text: { string }, executor: Player) -> Result<T>,
	suggestions: ((text: string, executor: Player) -> { string })?,
}

export type ArgumentType<T = unknown> = SingleArgumentType<T> | ListArgumentType<T>

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

export type Ok<T = unknown> = {
	success: true,
	read value: T,
}

export type Err = {
	success: false,
	read error: string,
}

export type Result<T = unknown> = Ok<T> | Err

export type CommandMap = { [string]: Command<unknown> }

export type PermissionRole = {
	name: string,
	priority: number,
	permissions: { [string]: boolean },
}

return nil
