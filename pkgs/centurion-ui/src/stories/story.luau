local fluid = require("../../fluid")
local function create_state(converted: { [string]: any }, controls: { [string]: any }, creator: (control: any) -> any)
	local states = {}

	for key, control in pairs(converted) do
		local controlValue = controls[key]

		if control.EntryType == "ControlGroup" then -- control is a control group, we need to recurse
			states[key] = create_state(control.Controls, controlValue, creator)
			continue
		end
		states[key] = creator(controlValue)
	end

	return states
end

local function update_state(
	states: { [string]: any },
	converted: { [string]: any },
	controls: { [string]: any },
	updater: (state: any, value: any) -> ()
)
	for key, control in pairs(converted) do
		local controlValue = controls[key]

		if control.EntryType == "ControlGroup" then -- control is a control group, we need to recurse
			update_state(states[key], control.Controls, controlValue, updater)
			continue
		end
		updater(states[key], controlValue)
	end
end

local function story(controls, render)
	return {
		controls = controls,
		render = function(props)
			local states = create_state(props.converted, props.controls, function(value)
				return fluid.source(value)
			end)

			local component = fluid.mount(function()
				return render(states)
			end, props.target)

			props.subscribe(function(values)
				update_state(states, props.converted, values, function(state, value)
					state(value)
				end)
			end)

			return function()
				component()
			end
		end,
	}
end

return story
