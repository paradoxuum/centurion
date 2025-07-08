local ReplicatedStorage = game:GetService("ReplicatedStorage")

local fluid = require("../fluid")

local source = fluid.source
local read = fluid.read
local cleanup = fluid.cleanup

export type Mode = "normal" | "even" | "scale" | "floor" | "ceil"

local BASE_RESOLUTION = Vector2.new(1920, 1080)
local MIN_SCALE = 0.5
local DOMINANT_AXIS = 0.5

local scale = source(1)

local function convert(value: number, mode: Mode?): number
	return if mode == "even"
		then math.round(value * scale() * 0.5) * 2
		elseif mode == "scale" then value * scale()
		elseif mode == "floor" then math.floor(value * scale())
		elseif mode == "ceil" then math.ceil(value * scale())
		else math.round(value * scale())
end

local function px<T>(value: T | () -> T, mode: Mode? | () -> Mode?): () -> T
	return function()
		local value, mode = read(value), read(mode)

		if typeof(value) == "number" then
			return convert(value, mode) :: any
		elseif typeof(value) == "UDim" then
			return UDim.new(value.Scale, convert(value.Offset, mode)) :: any
		elseif typeof(value) == "UDim2" then
			return UDim2.new(
					value.X.Scale,
					convert(value.X.Offset, mode),
					value.Y.Scale,
					convert(value.Y.Offset, mode)
				) :: any
		else
			error("unsupported type")
		end
	end
end

local function mount()
	local camera = workspace.CurrentCamera

	local function update()
		local width = math.log(camera.ViewportSize.X / BASE_RESOLUTION.X, 2)
		local height = math.log(camera.ViewportSize.Y / BASE_RESOLUTION.Y, 2)
		local centered = width + (height - width) * DOMINANT_AXIS
		scale(math.max(2 ^ centered, MIN_SCALE))
	end

	update()
	cleanup(camera:GetPropertyChangedSignal("ViewportSize"):Connect(update))
end

return setmetatable({ mount = mount }, {
	__call = function<T>(_, value: T | () -> T, mode: Mode? | () -> Mode?): () -> T
		return px(value, mode)
	end,
})
