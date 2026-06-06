-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local useEffect = _react.useEffect
local useMemo = _react.useMemo
local useRef = _react.useRef
local createMotion = TS.import(script, TS.getModule(script, "@rbxts", "ripple").src).createMotion
local RunService = TS.import(script, TS.getModule(script, "@rbxts", "services")).RunService
local webStyle = TS.import(script, script.Parent.Parent, "styles", "webStyle").webStyle
local function isAnimatable(value)
	local _value = value
	local t = typeof(_value)
	return t == "number" or t == "UDim" or t == "UDim2" or t == "Vector2" or t == "Vector3" or t == "Color3" or t == "CFrame" or t == "Rect"
end
local function useVariantResolver(animate, initial, variants, transition, parser)
	if parser == nil then
		parser = function(style)
			local result = webStyle(style).props
			for k, v in pairs(style) do
				if type(k) == "string" and k ~= "_parsed" and result[k] == nil then
					local firstChar = string.sub(k, 1, 1)
					if firstChar >= "A" and firstChar <= "Z" then
						result[k] = v
					end
				end
			end
			return result
		end
	end
	-- Parse all variants once to find animatable vs static keys
	local _binding = useMemo(function()
		local anim = {}
		local stat = {}
		if variants then
			for _, variantStyle in pairs(variants) do
				local parsed = parser(variantStyle)
				for key, value in pairs(parsed) do
					if isAnimatable(value) then
						anim[key] = true
					else
						stat[key] = true
					end
				end
			end
		end
		return {
			animatableKeys = anim,
			staticKeys = stat,
		}
	end, { variants, parser })
	local animatableKeys = _binding.animatableKeys
	local staticKeys = _binding.staticKeys
	-- Maintain independent motions and bindings per property
	-- to avoid Ripple's limitation with mixed type dictionaries.
	local motionState = useRef()
	if not motionState.current then
		motionState.current = {
			bindings = {},
			setBindings = {},
			motions = {},
			loopState = {},
		}
	end
	-- 1. Initialize bindings for each animatable key
	for key in animatableKeys do
		if not (motionState.current.bindings[key] ~= nil) then
			local initialVal = nil
			-- Seed priority: explicit `initial` prop → "idle" key → current animate target → first found
			local initialKey = initial
			local _condition = initialKey
			if _condition ~= "" and _condition then
				_condition = variants and variants[initialKey] and parser(variants[initialKey])[key] ~= nil
			end
			if _condition ~= "" and _condition then
				initialVal = parser(variants[initialKey])[key]
			elseif variants and variants.idle and parser(variants.idle)[key] ~= nil then
				initialVal = parser(variants.idle)[key]
			else
				local _condition_1 = animate
				if _condition_1 ~= "" and _condition_1 then
					_condition_1 = variants and variants[animate]
				end
				if _condition_1 ~= "" and _condition_1 then
					local parsed = parser(variants[animate])
					initialVal = parsed[key]
				end
			end
			-- If it's missing in the initial variant, grab it from any variant
			-- just to know its type for Ripple.
			if initialVal == nil and variants then
				for _, variantStyle in pairs(variants) do
					local parsed = parser(variantStyle)
					if parsed[key] ~= nil then
						initialVal = parsed[key]
						break
					end
				end
			end
			if initialVal ~= nil then
				local binding, setBinding = React.createBinding(initialVal)
				local motion = createMotion(initialVal)
				motionState.current.bindings[key] = binding
				motionState.current.setBindings[key] = setBinding
				motionState.current.motions[key] = motion
			end
		end
	end
	-- Setup Ripple heartbeat update loop
	useEffect(function()
		local state = motionState.current
		local connection = RunService.Heartbeat:Connect(function(dt)
			for key, motion in state.motions do
				local value = motion:step(dt)
				local binding = state.bindings[key]
				if value ~= (binding:getValue()) then
					state.setBindings[key](value)
				end
				-- Custom loop handling for repeating/reversing animations
				local loopData = state.loopState[key]
				if loopData and motion:isComplete() then
					if loopData.isReversing then
						-- We just finished reversing back to initial value.
						loopData.loopsDone += 1
						if loopData.repeatCount == -1 or loopData.loopsDone <= loopData.repeatCount then
							-- Play forward again
							loopData.isReversing = false
							motion:tween(loopData.targetValue, loopData.options)
						else
							state.loopState[key] = nil
						end
					else
						-- We just finished playing forward.
						if loopData.reverses then
							-- Now reverse
							loopData.isReversing = true
							motion:tween(loopData.initialValue, loopData.options)
						else
							-- We don't reverse, so just snap back and play forward
							loopData.loopsDone += 1
							if loopData.repeatCount == -1 or loopData.loopsDone <= loopData.repeatCount then
								motion:set(loopData.initialValue)
								motion:tween(loopData.targetValue, loopData.options)
							else
								state.loopState[key] = nil
							end
						end
					end
				end
			end
		end)
		return function()
			connection:Disconnect()
		end
	end, {})
	-- Animate target changes
	useEffect(function()
		local _condition = animate
		if _condition ~= "" and _condition then
			_condition = variants and variants[animate]
		end
		if _condition ~= "" and _condition then
			local parsed = parser(variants[animate])
			local options = {
				time = 0.3,
			}
			local repeatCount = 0
			local reverses = false
			if transition then
				local _object = {}
				local _left = "time"
				local _condition_1 = transition.Time
				if _condition_1 == nil then
					_condition_1 = 0.3
				end
				_object[_left] = _condition_1
				_object.style = transition.EasingStyle
				_object.direction = transition.EasingDirection
				_object.delayTime = transition.DelayTime
				options = _object
				local _condition_2 = transition.RepeatCount
				if _condition_2 == nil then
					_condition_2 = 0
				end
				repeatCount = _condition_2
				local _condition_3 = transition.Reverses
				if _condition_3 == nil then
					_condition_3 = false
				end
				reverses = _condition_3
			end
			for key in animatableKeys do
				local targetValue = parsed[key]
				if targetValue ~= nil then
					local motion = motionState.current.motions[key]
					if motion then
						if repeatCount ~= 0 or reverses then
							local existingLoop = motionState.current.loopState[key]
							-- Only reset the loop if we are targeting a new value
							-- or if we aren't currently looping this property
							if not existingLoop or existingLoop.targetValue ~= targetValue then
								local _loopState = motionState.current.loopState
								local _arg1 = {
									initialValue = motionState.current.bindings[key]:getValue(),
									targetValue = targetValue,
									options = options,
									repeatCount = repeatCount,
									reverses = reverses,
									loopsDone = 0,
									isReversing = false,
								}
								_loopState[key] = _arg1
								motion:tween(targetValue, options)
							end
						else
							-- Clear old loop state for this property to prevent conflicts
							motionState.current.loopState[key] = nil
							motion:tween(targetValue, options)
						end
					end
				end
			end
		end
	end, { animate, variants, transition, animatableKeys, parser })
	-- Create a plain object of the bindings to spread onto the component
	local animatedProps = useMemo(function()
		local props = {}
		for key, binding in motionState.current.bindings do
			if animatableKeys[key] ~= nil then
				props[key] = binding
			end
		end
		return props
	end, { animatableKeys })
	-- Compute current static props
	local staticProps = useMemo(function()
		local props = {}
		local _condition = animate
		if _condition ~= "" and _condition then
			_condition = variants and variants[animate]
		end
		if _condition ~= "" and _condition then
			local parsed = parser(variants[animate])
			for key in staticKeys do
				if parsed[key] ~= nil then
					props[key] = parsed[key]
				end
			end
		end
		return props
	end, { animate, variants, staticKeys, parser })
	return {
		animatedProps = animatedProps,
		staticProps = staticProps,
	}
end
return {
	isAnimatable = isAnimatable,
	useVariantResolver = useVariantResolver,
}
