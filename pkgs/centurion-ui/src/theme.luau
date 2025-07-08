local types = require("./types")

local font = Font.fromEnum(Enum.Font.SourceSans)

local palette = {
	mocha = {
		background = Color3.fromRGB(24, 24, 37),
		surface = Color3.fromRGB(30, 30, 46),
		text = Color3.fromRGB(205, 214, 244),
		subtext = Color3.fromRGB(166, 173, 200),
		highlight = Color3.fromRGB(137, 180, 250),
		success = Color3.fromRGB(166, 227, 161),
		error = Color3.fromRGB(243, 139, 168),
		font = font,
	} :: types.Theme,
	macchiato = {
		background = Color3.fromRGB(30, 32, 48),
		surface = Color3.fromRGB(36, 39, 58),
		text = Color3.fromRGB(202, 211, 245),
		subtext = Color3.fromRGB(165, 173, 203),
		highlight = Color3.fromRGB(138, 173, 244),
		success = Color3.fromRGB(166, 218, 149),
		error = Color3.fromRGB(237, 135, 150),
		font = font,
	} :: types.Theme,
	frappe = {
		background = Color3.fromRGB(41, 44, 60),
		surface = Color3.fromRGB(48, 52, 70),
		text = Color3.fromRGB(198, 208, 245),
		subtext = Color3.fromRGB(165, 173, 206),
		highlight = Color3.fromRGB(140, 170, 238),
		success = Color3.fromRGB(166, 209, 137),
		error = Color3.fromRGB(231, 130, 132),
		font = font,
	} :: types.Theme,
	latte = {
		background = Color3.fromRGB(230, 233, 239),
		surface = Color3.fromRGB(239, 241, 245),
		text = Color3.fromRGB(76, 79, 105),
		subtext = Color3.fromRGB(92, 95, 119),
		highlight = Color3.fromRGB(30, 102, 245),
		success = Color3.fromRGB(64, 160, 43),
		error = Color3.fromRGB(210, 15, 57),
		font = font,
	} :: types.Theme,
}

return palette
