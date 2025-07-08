local types = require("./types")

local guards = {}
local global_guards: { types.Guard } = {}

local function register(name: string, guard: types.Guard)
	assert(guards[name] == nil, "Guard with name '" .. name .. "' already exists.")

	guards[name] = guard
end

local function register_global(...: { types.Guard })
	for _, guard in ... do
		table.insert(global_guards, guard)
	end
end

return {
	register = register,
	register_global = register_global,
	guards = guards,
	global_guards = global_guards,
}
