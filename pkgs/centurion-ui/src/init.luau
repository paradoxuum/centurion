local Players = game:GetService("Players")

local analyse = require("@self/analyse")
local app = require("@self/app")
local fluid = require("./fluid")
local px = require("@self/px")
local state = require("@self/state")
local types = require("@self/types")

local mounted = false

local function mount(keys: { Enum.KeyCode })
	if mounted then
		return
	end
	mounted = true

	print(analyse(`centurion test 1 2 3`))

	local options = table.clone(state.options())
	options.activationKeys = keys
	state.options(options)

	fluid.mount(function()
		px.mount()
		return fluid.create "ScreenGui" {
			Enabled = state.opened,

			app(),
		}
	end, Players.LocalPlayer:WaitForChild("PlayerGui"))
end

local function set_theme(theme: types.Theme)
	state.theme.font(theme.font)
	state.theme.text(theme.text)
	state.theme.subtext(theme.subtext)
	state.theme.background(theme.background)
	state.theme.surface(theme.surface)
	state.theme.highlight(theme.highlight)
	state.theme.success(theme.success)
	state.theme.error(theme.error)
end

local function set_options(newOptions: types.Options) end

return {
	mount = mount,
	set_theme = set_theme,
}
