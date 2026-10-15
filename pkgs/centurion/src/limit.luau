local services = require("./services")

-- limits on remote command execution. everything sent over the `Execute`
-- remote is client-controlled, so each player gets a token bucket and the
-- request is size-checked before it reaches the registry
export type ExecuteLimits = {
	rate: number?,
	burst: number?,
	max_args: number?,
	max_arg_length: number?,
	max_input_length: number?,
}

type Bucket = {
	tokens: number,
	updated: number,
}

local opts = {
	rate = 2,
	-- how many commands can be executed in quick succession
	burst = 10,
	max_args = 32,
	max_arg_length = 256,
	max_input_length = 1024,
}

local buckets: { [Player]: Bucket } = {}
local player_removing_connection: RBXScriptConnection?

local limit = {
	-- replaceable so tests can control time
	clock = os.clock,
}

-- buckets are cleared when a player leaves. this is connected on first use
-- rather than at load so that requiring this module never touches the datamodel
local function track_players()
	if player_removing_connection then
		return
	end

	player_removing_connection = services.Players.PlayerRemoving:Connect(function(player)
		buckets[player] = nil
	end)
end

local function take_token(player: Player): boolean
	track_players()

	local now = limit.clock()
	local bucket = buckets[player]
	if bucket then
		bucket.tokens = math.min(opts.burst, bucket.tokens + (now - bucket.updated) * opts.rate)
		bucket.updated = now
	else
		bucket = { tokens = opts.burst, updated = now }
		buckets[player] = bucket
	end

	if bucket.tokens < 1 then
		return false
	end

	bucket.tokens -= 1
	return true
end

function limit.check_name(name: string): boolean
	return #name <= opts.max_arg_length
end

function limit.check(player: Player, name: string, args: { string }?, input: string?): string?
	if not take_token(player) then
		return "You're running commands too quickly. Try again in a moment."
	end

	if not limit.check_name(name) then
		return `Command name is too long (max {opts.max_arg_length} characters).`
	end

	if args then
		if #args > opts.max_args then
			return `Too many arguments (max {opts.max_args}).`
		end

		for _, arg in args do
			if #arg > opts.max_arg_length then
				return `Argument is too long (max {opts.max_arg_length} characters).`
			end
		end
	end

	if input and #input > opts.max_input_length then
		return `Input is too long (max {opts.max_input_length} characters).`
	end

	return nil
end

function limit.set_options(options: ExecuteLimits)
	local current = opts :: { [string]: number }
	for key, value in options :: { [string]: number } do
		assert(
			current[key] ~= nil,
			`Unknown execute limit '{key}'. Expected rate, burst, max_args, max_arg_length or max_input_length.`
		)
		assert(type(value) == "number" and value > 0, `Execute limit '{key}' must be a positive number.`)
		current[key] = value
	end
end

function limit.reset(player: Player?)
	if player then
		buckets[player] = nil
	else
		table.clear(buckets)
	end
end

return limit
