opt server_output = "server/network.luau"
opt client_output = "client/network.luau"

type SyncPayload = enum "type" {
    init {
        data: CommandMap,
    },
    patch {
        data: CommandMap
    }
}

type Command = struct {
	description: string?,
    arguments: Argument[]?,
    guards: string[]?
}


type Argument = struct {
	name: string,
	type: string,
	optional: boolean?,
	description: string?,
    num_args: (string | i8)?,
}

type ExecutionContext = struct {
    executor: Instance (Player),
    command: string,
    input: string,
    "args": string[],
    response: struct {
        success: boolean,
        message: string,
        timestamp: u32
    }?
}

type CommandMap = map { [string]: Command }

event SyncState = {
    from: Server,
    type: Reliable,
    call: SingleAsync,
    data: SyncPayload
}

event RequestState = {
    from: Client,
    type: Reliable,
    call: SingleAsync
}

funct Execute = {
    call: Async,
    args: (Command: string, Args: string[]?),
    rets: ExecutionContext
}
