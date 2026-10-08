local testkit = require("./testkit").test()

local FINISH = testkit.FINISH

require("./argument")
require("./command")
require("./resolve")

local ok = FINISH()
if not ok then
	error("Tests failed", 0)
end
