local vide = require("../vide")

local read = vide.read

-- how visible the current subtree is, from 0 (hidden) to 1 (shown). Lets the
-- console fade as a whole without a CanvasGroup, which would soften text
local opacity = vide.context(function()
	return 1
end :: () -> number)

-- combines a transparency with the surrounding opacity
local function fade(transparency: (number | () -> number)?): () -> number
	local current = opacity()
	return function()
		local value = read(transparency) or 0
		return 1 - (1 - value) * current()
	end
end

return {
	opacity = opacity,
	fade = fade,
}
