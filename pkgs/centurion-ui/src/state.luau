local theme = require("./theme")
local types = require("./types")
local vide = require("../vide")

local source = vide.source

return {
	opened = source(false),
	focused = source(false),
	logs = source({} :: { types.Log }),

	-- options
	activation_keys = source({}),
	hide_on_lost_focus = source(true),
	theme = source(theme.themes.mocha),
	icon = source("rbxassetid://115292290730914"),
	transparency = source(0.2),
	format_date = function(log: types.Log)
		local dateTime = DateTime.fromUnixTimestamp(log.response.timestamp):FormatLocalTime("LT", "en-us")
		local dateParts = dateTime:split(" ")
		return `<b>{dateParts[1]}</b> {dateParts[2]}`
	end,

	text_size = source(28),
	subtext_size = source(24),

	anchor = source(Vector2.zero),
	position = source(UDim2.new()),
	width = source(UDim.new(1, 0)),
}
