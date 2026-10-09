local types = require("./types")

local guards = {}
local global_guards: { types.Guard } = {}

local function register(name: string, guard: types.Guard)
	assert(guards[name] == nil, "Guard with name '" .. name .. "' already exists.")

	guards[name] = guard
end

local function unregister(name: string)
	assert(guards[name] ~= nil, "Guard with name '" .. name .. "' is not registered.")

	guards[name] = nil
end

-- returns a function that removes the guard again. calling it more than once
-- does nothing.
local function add_global(guard: types.Guard): () -> ()
	table.insert(global_guards, guard)

	local removed = false
	return function()
		if removed then
			return
		end
		removed = true

		local index = table.find(global_guards, guard)
		if index then
			table.remove(global_guards, index)
		end
	end
end

return {
	register = register,
	unregister = unregister,
	add_global = add_global,
	guards = guards,
	global_guards = global_guards,
}
