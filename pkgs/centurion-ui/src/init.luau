local Players = game:GetService("Players")

local app = require("@self/app")
local px = require("@self/px")
local state = require("@self/state")
local theme = require("@self/theme")
local vide = require("./vide")

local mounted = false

local function mount(keys: { Enum.KeyCode })
	if mounted then
		return
	end
	mounted = true

	state.activation_keys(keys)

	vide.mount(function()
		px.mount()
		return vide.create "ScreenGui" {
			Enabled = state.opened,

			app(),
		}
	end, Players.LocalPlayer:WaitForChild("PlayerGui"))
end

local function set_opt<T>(source: () -> T, value: T?)
	if value == nil then
		return
	end
	source(value)
end

local function configure(options: unknown)
	set_opt(state.hide_on_lost_focus, options.hide_on_lost_focus)
	set_opt(state.activation_keys, options.activation_keys)
	set_opt(state.theme, options.theme)
	set_opt(state.icon, options.icon)

	if options.format_date and typeof(options.format_date) == "function" then
		state.format_date = options.format_date
	end
end

return {
	mount = mount,
	configure = configure,
	themes = theme.themes,
}
