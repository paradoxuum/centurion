local corner = require("../components/corner")
local flex = require("../components/flex")
local padding = require("../components/padding")
local px = require("../px")
local state = require("../state")
local textbox = require("../components/textbox")
local types = require("../types")
local vide = require("../../vide")

local action = vide.action
local create = vide.create
local changed = vide.changed
local cleanup = vide.cleanup
local indexes = vide.indexes
local source = vide.source

type Logs = {
	[number]: unknown,
}

local function history()
	local content_height = source(Vector2.new())

	return vide.create "ScrollingFrame" {
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		BackgroundTransparency = 1,
		CanvasSize = UDim2.new(1, 0, 0, 0),
		ScrollingDirection = Enum.ScrollingDirection.Y,
		Size = vide.spring(function()
			return UDim2.fromOffset(0, content_height().Y)
		end, 0.1),
		Visible = function()
			return #state.logs() > 0
		end,

		create "UIListLayout" {
			HorizontalFlex = Enum.UIFlexAlignment.Fill,
			SortOrder = Enum.SortOrder.LayoutOrder,

			changed("AbsoluteContentSize", content_height),
		},

		action(function(instance: ScrollingFrame)
			local connection = instance:GetPropertyChangedSignal("AbsoluteCanvasSize"):Connect(function()
				instance.CanvasPosition = Vector2.new(0, instance.AbsoluteCanvasSize.Y)
			end)

			cleanup(function()
				return connection:Disconnect()
			end)
		end),

		indexes(state.logs, function(value: () -> types.Log, i: number)
			return create "Frame" {
				AutomaticSize = "XY",
				BackgroundTransparency = 1,
				LayoutOrder = function()
					return #state.logs() - i + 1
				end,

				flex():row(),

				padding {
					x = px(8),
					top = px(8),
					bottom = px(function()
						return i == 1 and 4 or 0
					end),
				},

				create "Frame" {
					AutomaticSize = "XY",
					BackgroundTransparency = 1,

					flex():fill("horizontal"):vertical("center"):gap(8):column(),

					create "Frame" {
						AutomaticSize = "XY",

						BackgroundColor3 = function()
							return value().response.success and state.theme().highlight or state.theme().error
						end,

						corner(px(4)),

						padding(px(4)),
						flex():fill("horizontal"):vertical("center"):gap(4):column(),

						create "ImageLabel" {
							BackgroundTransparency = 1,
							Image = function()
								return state.icon()
							end,
							ImageColor3 = function()
								return state.theme().background
							end,
							ScaleType = Enum.ScaleType.Fit,
							Size = px(function()
								return UDim2.fromOffset(state.subtext_size(), state.subtext_size())
							end),
							Visible = function()
								return state.icon() ~= ""
							end,
						},

						textbox {
							text = function()
								return state.format_date(value()) or ""
							end,
							text_size = px(state.subtext_size),
							text_style = "bg",
							rich_text = true,
							editable = false,
						},
					},

					textbox {
						auto = "XY",
						text = function()
							return value().command
						end,
						xalignment = Enum.TextXAlignment.Left,
						editable = false,
					},
				},

				textbox {
					auto = "XY",
					text = function()
						return value().response.message or "N/A"
					end,
					text_style = function()
						return value().response.success and "normal" or "error"
					end,
					rich_text = true,
					editable = false,
					xalignment = Enum.TextXAlignment.Left,
				},
			}
		end),
	}
end

return history
