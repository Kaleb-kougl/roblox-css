-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * Image.tsx — <img> equivalent for Roblox.
	 *
	 * Renders an <imagelabel> with web-like style props.
	 * Accepts `src` (maps to Image property) as rbxassetid:// URI.
	 *
	 * Maps to: HTML <img> → Roblox <imagelabel>
	 
]]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local forwardRef = _react.forwardRef
local useWebStyle = TS.import(script, script.Parent, "useWebStyle").useWebStyle
--[[
	*
	 * Branded ImageProps — the `_imageProps` brand ensures strict nominal typing.
	 * This prevents accidental bypasses or incorrect prop structures.
	 
]]
--* Helper to construct a branded ImageProps. 
local function makeImageProps(props)
	return props
end
--[[
	*
	 * Image component — The primary component for rendering images.
	 *
	 * Maps to: HTML <img> → Roblox <imagelabel>
	 * Renders a native <imagelabel> while mapping web styles and translating `src` to the `Image` property.
	 
]]
local Image = forwardRef(function(props, ref)
	-- 1. Extract custom styling props, src, and children
	local style = props.style
	local src = props.src
	local children = props.children
	local defaultProps = {
		BackgroundTransparency = 1,
	}
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.style = nil
	explicitProps.src = nil
	explicitProps.children = nil
	-- 3. Map src prop to the Image property
	if src ~= nil then
		explicitProps.Image = src
	end
	local parsedStyleProps = {}
	local parsedStyleChildren = {}
	-- Cached across renders while the style values are unchanged — see useWebStyle.
	local parsed = useWebStyle(style)
	-- 4. If a style object is provided, compile it
	if style ~= nil and parsed ~= nil then
		parsedStyleProps = parsed.props
		parsedStyleChildren = parsed.children
		if style.opacity ~= nil then
			-- Copy before writing: the parse result is shared across renders, so
			-- mutating it in place would re-apply the opacity multiplication on
			-- every render and fade the image progressively.
			local _condition = (parsedStyleProps.ImageTransparency)
			if _condition == nil then
				_condition = 0
			end
			local currentImageTrans = _condition
			local _object_1 = table.clone(parsedStyleProps)
			setmetatable(_object_1, nil)
			parsedStyleProps = _object_1
			parsedStyleProps.ImageTransparency = 1 - ((1 - currentImageTrans) * style.opacity)
		end
	end
	-- 5. Render the native imagelabel with merged properties and children
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
	return React.createElement("imagelabel", _attributes, parsedStyleChildren, children)
end)
return {
	makeImageProps = makeImageProps,
	Image = Image,
}
