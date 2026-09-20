-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local useWebStyle = TS.import(script, script.Parent, "useWebStyle").useWebStyle
local useVariantResolver = TS.import(script, script.Parent, "useVariantResolver").useVariantResolver
--[[
	*
	 * MotionImage component — Declarative animated equivalent of Image.
	 
]]
local MotionImage = forwardRef(function(props, ref)
	local animate = props.animate
	local initial = props.initial
	local variants = props.variants
	local transition = props.transition
	local style = props.style
	local src = props.src
	local children = props.children
	local _binding = useVariantResolver(animate, initial, variants, transition)
	local animatedProps = _binding.animatedProps
	local staticProps = _binding.staticProps
	local defaultProps = {
		BackgroundTransparency = 1,
	}
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.animate = nil
	explicitProps.initial = nil
	explicitProps.variants = nil
	explicitProps.transition = nil
	explicitProps.style = nil
	explicitProps.src = nil
	explicitProps.children = nil
	explicitProps._motionImageProps = nil
	if src ~= nil then
		explicitProps.Image = src
	end
	local parsedStyleProps = {}
	local parsedStyleChildren = {}
	-- Cached across renders while the style values are unchanged — see useWebStyle.
	local parsed = useWebStyle(style)
	if parsed ~= nil then
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
	return React.createElement("imagelabel", _attributes, parsedStyleChildren, children)
end)
return {
	MotionImage = MotionImage,
}
