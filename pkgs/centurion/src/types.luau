export type Command<T...> = {
	callback: (ctx: ExecutionContext, T...) -> any,
	description: string?,
	arguments: () -> T...,
	guards: { string | Guard }?,
}

export type Argument = {
	name: string,
	type: string,
	optional: boolean?,
	description: string?,
	num_args: (number | "rest")?,
	suggestions: { string }?,
}

export type ArgumentType = {
	transform: (text: string, executor: Player) -> Result,
	suggestions: ((text: string, executor: Player) -> { string })?,
}

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

return nil
