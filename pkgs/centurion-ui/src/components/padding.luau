local fluid = require("../../fluid")

local create = fluid.create
local read = fluid.read

type Can<T> = T | () -> T
type Padding = {
	read padding: Can<number>?,
	read x: Can<number>?,
	read y: Can<number>?,
	read left: Can<number>?,
	read right: Can<number>?,
	read top: Can<number>?,
	read bottom: Can<number>?,
}

local function padding(props: Padding)
	local pad = props.padding or 0
	local x = props.x or pad
	local y = props.y or pad
	local left = props.left or x
	local right = props.right or x
	local top = props.top or y
	local bottom = props.bottom or y

	return create "UIPadding" {
		PaddingLeft = function()
			return UDim.new(0, read(left))
		end,
		PaddingRight = function()
			return UDim.new(0, read(right))
		end,
		PaddingTop = function()
			return UDim.new(0, read(top))
		end,
		PaddingBottom = function()
			return UDim.new(0, read(bottom))
		end,
	}
end

return padding
