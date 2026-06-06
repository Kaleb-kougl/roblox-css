-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local useVariantResolver = TS.import(script, script.Parent, "useVariantResolver").useVariantResolver
--[[
	*
	 * MotionUIScale component — Declarative animated equivalent of UIScale.
	 
]]
local MotionUIScale = forwardRef(function(props, ref)
	local animate = props.animate
	local initial = props.initial
	local variants = props.variants
	local transition = props.transition
	-- We pass a dummy parser that just passes through styles,
	-- because UIScale doesn't use CSS webStyle mappings.
	local _binding = useVariantResolver(animate, initial, variants, transition, function(style)
		return style
	end)
	local animatedProps = _binding.animatedProps
	local staticProps = _binding.staticProps
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local uiscaleProps = _object
	uiscaleProps.animate = nil
	uiscaleProps.initial = nil
	uiscaleProps.variants = nil
	uiscaleProps.transition = nil
	uiscaleProps._motionUIScaleProps = nil
	local _attributes = {
		ref = ref,
	}
	for _k, _v in uiscaleProps do
		_attributes[_k] = _v
	end
	for _k, _v in staticProps do
		_attributes[_k] = _v
	end
	for _k, _v in animatedProps do
		_attributes[_k] = _v
	end
	return React.createElement("uiscale", _attributes)
end)
return {
	MotionUIScale = MotionUIScale,
}
