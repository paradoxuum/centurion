local app = require("../app")
local story = require("./story")

return story({}, function()
	return app()
end)
