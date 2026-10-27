local background = require("../components/background")
local container = require("../components/container")
local corner = require("../components/corner")
local fade = require("../fade")
local flex = require("../components/flex")
local padding = require("../components/padding")
local px = require("../px")
local state = require("../state")
local text = require("../components/text")
local textbox = require("../components/textbox")
local types = require("../types")
local vide = require("../../vide")

local action = vide.action
local create = vide.create
local changed = vide.changed
local cleanup = vide.cleanup
local effect = vide.effect
local indexes = vide.indexes
local read = vide.read
local source = vide.source
local spring = vide.spring

type History = {
	read max_lines: number | () -> number,
	-- the most room the history can take up, in pixels, so it fits on screen
	read max_height: (() -> number)?,
	read on_select: (command: string) -> (),
	read order: number?,

	[number]: unknown,
}

local line_height = 23
local top_padding = 4
-- width of the status glyph column, which the message is indented by
local gutter = 12

local function entry(value: () -> types.Log, i: number, on_select: (command: string) -> ())
	local hovered = source(false)

	-- 1 = hidden, 0 = shown
	local enter = spring(function()
		return 0
	end, 0.3)

	-- the first index always holds the newest log, so animate it whenever it changes
	if i == 1 then
		effect(function()
			value()
			enter(1)
		end)
	end

	local function success()
		return value().response.success
	end

	return background {
		auto = "Y",
		size = UDim2.fromScale(1, 0),
		order = function()
			return #state.logs() - i + 1
		end,
		-- failed commands get a faint tint so they stand out when scrolling
		color = function()
			return state.theme().error
		end,
		transparency = function()
			return if success() then 1 else 0.88 + 0.12 * enter()
		end,

		corner(px(4)),
		padding {
			left = px(function()
				return 5 + 12 * enter()
			end),
			right = px(5),
			y = px(4),
		},
		flex():row():fill("horizontal"):gap(1),

		-- clicking the header puts the command back into the input
		create "TextButton" {
			AutomaticSize = Enum.AutomaticSize.Y,
			Size = UDim2.fromScale(1, 0),
			AutoButtonColor = false,
			BackgroundTransparency = 1,
			LayoutOrder = 1,
			Text = "",

			Activated = function()
				on_select(value().command)
			end,
			MouseEnter = function()
				hovered(true)
			end,
			MouseLeave = function()
				hovered(false)
			end,

			flex():column():vertical("center"):between("horizontal"),

			container {
				auto = "XY",
				order = 1,

				flex():column():vertical("center"),

				text {
					size = px(UDim2.fromOffset(gutter, 0)),
					auto = "Y",
					order = 1,
					text = ">",
					text_style = function()
						return if success() then "highlight" else "error"
					end,
					weight = Enum.FontWeight.Bold,
					xalignment = Enum.TextXAlignment.Left,
					transparency = enter,
				},

				text {
					auto = "XY",
					order = 2,
					text = function()
						return value().command
					end,
					text_style = function()
						return if hovered() then "highlight" else "normal"
					end,
					weight = Enum.FontWeight.Bold,
					xalignment = Enum.TextXAlignment.Left,
					transparency = enter,
				},
			},

			text {
				auto = "XY",
				order = 2,
				text = function()
					return state.format_date()(value()) or ""
				end,
				text_size = px(state.subtext_size),
				text_style = "subtext",
				rich_text = true,
				transparency = function()
					-- dimmed until the entry is hovered
					return enter() + (1 - enter()) * (if hovered() then 0 else 0.4)
				end,
			},
		},

		container {
			auto = "Y",
			size = UDim2.fromScale(1, 0),
			order = 2,

			padding { left = px(gutter) },

			textbox {
				text = function()
					return value().response.message or "N/A"
				end,
				text_style = function()
					return if success() then "normal" else "error"
				end,
				rich_text = true,
				editable = false,
				xalignment = Enum.TextXAlignment.Left,
				wrapped = true,
				transparency = enter,

				-- fill the width so long messages wrap instead of overflowing
				{
					AutomaticSize = Enum.AutomaticSize.Y,
					Size = UDim2.fromScale(1, 0),
					ClearTextOnFocus = false,
				},
			},
		},
	}
end

local function history(props: History)
	local content_height = source(0)
	local hovered = source(false)
	local max_height = px(function()
		return line_height * (read(props.max_lines) :: number)
	end)

	return create "ScrollingFrame" {
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		CanvasSize = UDim2.new(1, 0, 0, 0),
		ScrollingDirection = Enum.ScrollingDirection.Y,
		LayoutOrder = props.order,
		Size = spring(function()
			local height = content_height()
			if height == 0 then
				return UDim2.new()
			end
			height = math.min(height, max_height()) + px.convert(top_padding)
			if props.max_height then
				height = math.min(height, math.max(props.max_height(), 0))
			end
			return UDim2.fromOffset(0, height)
		end, 0.1),

		ScrollBarThickness = px(3),
		ScrollBarImageColor3 = function()
			return state.theme().subtext
		end,
		ScrollBarImageTransparency = fade.fade(spring(function()
			return if hovered() then 0 else 0.6
		end, 0.2)),
		VerticalScrollBarInset = Enum.ScrollBarInset.ScrollBar,

		MouseEnter = function()
			hovered(true)
		end,
		MouseLeave = function()
			hovered(false)
		end,

		padding { x = px(4), top = px(top_padding) },

		create "UIListLayout" {
			HorizontalFlex = Enum.UIFlexAlignment.Fill,
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = px(UDim.new(0, top_padding)),

			changed("AbsoluteContentSize", function(size: Vector2)
				content_height(size.Y)
			end),
		},

		-- follow new output, unless the user has scrolled up to read something
		action(function(instance: ScrollingFrame)
			local stick = true

			local function bottom()
				return math.max(instance.AbsoluteCanvasSize.Y - instance.AbsoluteWindowSize.Y, 0)
			end

			cleanup(instance:GetPropertyChangedSignal("CanvasPosition"):Connect(function()
				stick = instance.CanvasPosition.Y >= bottom() - 2
			end))

			cleanup(instance:GetPropertyChangedSignal("AbsoluteCanvasSize"):Connect(function()
				if stick then
					instance.CanvasPosition = Vector2.new(0, bottom())
				end
			end))

			-- a new entry always scrolls back down
			effect(function()
				state.logs()
				stick = true
				instance.CanvasPosition = Vector2.new(0, bottom())
			end)
		end),

		indexes(state.logs, function(value: () -> types.Log, i: number)
			return entry(value, i, props.on_select)
		end),

		unpack(props),
	}
end

return history
