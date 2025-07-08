local centurion = require("../centurion")
local fluid = require("../fluid")
local theme = require("./theme")
local types = require("./types")

local source = fluid.source

local mocha = theme.mocha

return {
	opened = source(false),
	logs = source({} :: { centurion.Response }),
	options = source({
		activationKeys = {},
		hideOnLostFocus = true,
	} :: types.Options),
	theme = {
		font = source(mocha.font),
		text = source(mocha.text),
		subtext = source(mocha.subtext),
		background = source(mocha.background),
		surface = source(mocha.surface),
		highlight = source(mocha.highlight),
		success = source(mocha.success),
		error = source(mocha.error),
	},
}
