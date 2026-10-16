-- props are read-only to work around a new solver bug where a table literal
-- that omits an optional prop fails to infer a generic pack like `T...`
export type Command<T...> = {
	read callback: (ctx: ExecutionContext, T...) -> ...any,
	read description: string?,
	read arguments: (() -> T...)?,
	read guards: { string | Guard }?,
	read roles: { string }?,
	read permissions: { string }?,
}

export type CommandDefinition<T...> = {
	read description: string?,
	read arguments: (() -> T...)?,
	read guards: { string | Guard }?,
	read roles: { string }?,
	read permissions: { string }?,
}

-- the callback is passed separately so that `T...` is already known when the
-- callback is checked, which lets its parameters be inferred from `arguments`
export type CommandBuilder<T...> = {
	callback: (self: CommandBuilder<T...>, callback: (ctx: ExecutionContext, T...) -> ...any) -> (),
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
	permissions: { [string]: boolean },
	inherits: { string },
}

return nil
