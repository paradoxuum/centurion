local ReplicatedStorage = game:GetService("ReplicatedStorage")

local packages = ReplicatedStorage.rbxts_include.node_modules["@rbxts"]
local Midori = require(packages.midori.src)

Midori.runTests(packages.commander.src)