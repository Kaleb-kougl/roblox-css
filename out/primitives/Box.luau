-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * Box.tsx — The foundational UI container component for Roblox.
	 *
	 * Provides a <div> equivalent that supports a web-like CSS syntax (`style` prop).
	 * It automatically translates CSS properties (e.g., `backgroundColor: "red"`) into 
	 * Roblox engine equivalents (`BackgroundColor3`) and injects layout constraints 
	 * like `UICorner`, `UIPadding`, `UIListLayout`, and `UIGridLayout` as child instances.
	 * 
	 * Usage:
	 *   <Box style={{ width: "100%", height: "50px", backgroundColor: "#333", borderRadius: "8px" }}>
	 *     <textlabel Text="Hello World" />
	 *   </Box>
	 
]]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local useRef = _react.useRef
local ParentSizeContext = TS.import(script, script.Parent.Parent, "styles", "ParentSizeContext").ParentSizeContext
local usePercentageConstraints = TS.import(script, script.Parent, "usePercentageConstraints").usePercentageConstraints
local useWebStyle = TS.import(script, script.Parent, "useWebStyle").useWebStyle
local function makeBoxProps(props)
	return props
end
local Box = React.forwardRef(function(props, ref)
	local style = props.style
	local children = props.children
	local defaultProps = {
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
	}
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.style = nil
	explicitProps.children = nil
	-- Merge user-provided Change listeners with our internal AbsoluteSize tracker
	-- to avoid silently overwriting user event handlers.
	local userChange = (props.Change) or {}
	local _object_1 = table.clone(userChange)
	setmetatable(_object_1, nil)
	local mergedChange = _object_1
	local setAbsSize
	mergedChange.AbsoluteSize = function(rbx)
		setAbsSize(rbx.AbsoluteSize)
		-- Forward to user handler if present
		local userHandler = userChange.AbsoluteSize
		if userHandler ~= nil then
			userHandler(rbx)
		end
	end
	explicitProps.Change = nil
	local bindingRef = useRef()
	if not bindingRef.current then
		local binding, setBinding = React.createBinding(Vector2.new(math.huge, math.huge))
		bindingRef.current = {
			binding = binding,
			set = setBinding,
		}
	end
	local _binding = bindingRef.current
	local absSize = _binding.binding
	setAbsSize = _binding.set
	local percentageConstraint = usePercentageConstraints(style)
	-- Cached across renders while the style values are unchanged — see useWebStyle.
	local parsedStyle = useWebStyle(style)
	if parsedStyle ~= nil then
		local _attributes = {
			ref = ref,
		}
		for _k, _v in defaultProps do
			_attributes[_k] = _v
		end
		for _k, _v in parsedStyle.props do
			_attributes[_k] = _v
		end
		for _k, _v in explicitProps do
			_attributes[_k] = _v
		end
		_attributes.Change = mergedChange
		return React.createElement(ParentSizeContext.Provider, {
			value = absSize,
		}, React.createElement("frame", _attributes, parsedStyle.children, percentageConstraint, children))
	end
	local _attributes = {
		ref = ref,
	}
	for _k, _v in defaultProps do
		_attributes[_k] = _v
	end
	for _k, _v in explicitProps do
		_attributes[_k] = _v
	end
	_attributes.Change = mergedChange
	return React.createElement(ParentSizeContext.Provider, {
		value = absSize,
	}, React.createElement("frame", _attributes, children))
end)
return {
	makeBoxProps = makeBoxProps,
	Box = Box,
}
