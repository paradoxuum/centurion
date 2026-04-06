local Players = game:GetService("Players")

local app = require("@self/app")
local centurion = require("./centurion")
local px = require("@self/px")
local state = require("@self/state")
local theme = require("@self/theme")
local types = require("@self/types")
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

	set_opt(state.text_size, options.text_size)
	set_opt(state.subtext_size, options.subtext_size)

	set_opt(state.anchor, options.anchor)
	set_opt(state.position, options.position)
	set_opt(state.width, options.width)

	state.max_suggestions = options.max_suggestions or 5
	if options.format_date and typeof(options.format_date) == "function" then
		state.format_date = options.format_date
	end
end

local function register_commands()
	local cmd = centurion.register_command
	cmd("centurion clear", {
		description = "Clear the command history",
		callback = function()
			state.logs({})
			return ""
		end,
	})

	local theme_names: { types.Theme } = {}
	for name in pairs(theme.themes) do
		table.insert(theme_names, name)
	end

	local centurion_theme = centurion.register_type("centurion-theme", centurion.create_enum(theme_names))
	cmd("centurion theme", {
		description = "Change the theme",
		arguments = function()
			return centurion_theme("theme", "The name of the theme to switch to")
		end,
		callback = function(ctx, theme_name)
			local data = theme.themes[theme_name]
			if not data then
				ctx.error("Theme '" .. theme_name .. "' does not exist.")
				return
			end

			state.theme(data)
			return `Theme changed to {theme_name}`
		end,
	})
end

return {
	mount = mount,
	configure = configure,
	register_commands = register_commands,
	themes = theme.themes,
}
