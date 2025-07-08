local UserInputService = game:GetService("UserInputService")

local background = require("./components/background")
local centurion = require("../centurion")
local container = require("./components/container")
local corner = require("./components/corner")
local flex = require("./components/flex")
local fluid = require("../fluid")
local padding = require("./components/padding")
local px = require("./px")
local state = require("./state")
local textbox = require("./components/textbox")

local create = fluid.create
local cleanup = fluid.cleanup
local derive = fluid.derive
local source = fluid.source

local function app()
	local raw_text = source("")

	local unsubscribe = centurion.command.on_execute(function(ctx)
		local new = table.clone(state.logs())
		table.insert(new, ctx.response)
		state.logs(new)
	end)

	local activationKeys = derive(function()
		local keys = {}
		for _, key in ipairs(state.options().activationKeys) do
			keys[key] = true
		end
		return keys
	end)

	local inputConnection = UserInputService.InputBegan:Connect(function(input, processed)
		if processed then
			return
		end

		if input.UserInputState ~= Enum.UserInputState.Begin then
			return
		end

		if not activationKeys()[input.KeyCode] then
			return
		end

		state.opened(not state.opened())
	end)

	cleanup(function()
		unsubscribe()
		inputConnection:Disconnect()
	end)

	return create "Frame" {
		Size = px(UDim2.new(1, 0, 0, 64)),
		BackgroundTransparency = 1,

		corner(px(8)),
		padding { padding = px(12) },

		flex():fill("horizontal"):vertical "bottom",

		background {
			auto = "Y",
			color = state.theme.surface,

			corner(px(4)),

			padding {
				padding = px(8),
			},

			textbox {
				placeholder = "Enter command",
				xalignment = Enum.TextXAlignment.Left,
				text_size = px(24),
				text_color = state.theme.text,
				update_text = function(text)
					raw_text(text)
				end,
			},

			flex():fill():vertical("center"):horizontal "left",
		},
	}
end

return app
