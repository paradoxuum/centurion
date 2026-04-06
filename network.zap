opt server_output = "pkgs/centurion/src/sync/network/server.luau"
opt client_output = "pkgs/centurion/src/sync/network/client.luau"
opt remote_scope = "CENTURION"

type SyncData = enum "kind" {
	command { data: Command },
	none    {},
}

type SyncMap = map { [string.binary]: SyncData }

type SyncPayload = enum "type" {
	init  { data: SyncMap },
	patch { data: SyncMap },
}

type Command = struct {
	description: string.binary?,
	arguments: unknown,
}

type ExecutionContext = struct {
	executor: Instance.Player,
	command: string.binary,
	input: string.binary,
	arguments: string.binary[],
	response: struct {
		success: boolean,
		message: string.binary,
		timestamp: u32,
	}?,
}

event SyncState = {
	from: Server,
	type: Reliable,
	call: SingleAsync,
	data: SyncPayload,
}

event RequestState = {
	from: Client,
	type: Reliable,
	call: SingleAsync,
}

funct Execute = {
	call: Async,
	args: (
		Command: string.binary,
		Args: string.binary[]?,
	),
	rets: ExecutionContext,
}
