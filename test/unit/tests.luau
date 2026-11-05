local testkit = require("./testkit").test()

local FINISH = testkit.FINISH

require("./analyse")
require("./argument")
require("./command")
require("./cursor")
require("./duration")
require("./leventine")
require("./limit")
require("./log")
require("./parse")
require("./player")
require("./resolve")
require("./suggest")
require("./sync")
require("./user")

local ok = FINISH()
if not ok then
	error("Tests failed", 0)
end
