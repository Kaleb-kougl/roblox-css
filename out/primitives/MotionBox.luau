-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local webStyle = TS.import(script, script.Parent.Parent, "styles", "webStyle").webStyle
local useVariantResolver = TS.import(script, script.Parent, "useVariantResolver").useVariantResolver
--[[
	*
	 * MotionBox component — Declarative animated equivalent of Box.
	 *
	 * Exposes Framer Motion-like props (`animate`, `variants`, `transition`) 
	 * over the base `webStyle` layout engine.
	 
]]
local MotionBox = forwardRef(function(props, ref)
	local animate = props.animate
	local initial = props.initial
	local variants = props.variants
	local transition = props.transition
	local style = props.style
	local children = props.children
	local _binding = useVariantResolver(animate, initial, variants, transition)
	local animatedProps = _binding.animatedProps
	local staticProps = _binding.staticProps
	local defaultProps = {
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
	}
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.animate = nil
	explicitProps.initial = nil
	explicitProps.variants = nil
	explicitProps.transition = nil
	explicitProps.style = nil
	explicitProps.children = nil
	explicitProps._motionBoxProps = nil
	local parsedStyleProps = {}
	local parsedStyleChildren = {}
	if style then
		local parsed = webStyle(style)
		parsedStyleProps = parsed.props
		parsedStyleChildren = parsed.children
	end
	local _attributes = {
		ref = ref,
	}
	for _k, _v in defaultProps do
		_attributes[_k] = _v
	end
	for _k, _v in parsedStyleProps do
		_attributes[_k] = _v
	end
	for _k, _v in explicitProps do
		_attributes[_k] = _v
	end
	for _k, _v in staticProps do
		_attributes[_k] = _v
	end
	for _k, _v in animatedProps do
		_attributes[_k] = _v
	end
	return React.createElement("frame", _attributes, parsedStyleChildren, children)
end)
return {
	MotionBox = MotionBox,
}
