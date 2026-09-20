-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * ScrollBox.tsx — A scrollable container component for Roblox.
	 *
	 * Provides a scrollable <div> equivalent that supports a web-like CSS syntax (`style` prop).
	 * It automatically translates CSS properties (e.g., `backgroundColor: "red"`) into
	 * Roblox engine equivalents (`BackgroundColor3`) and injects layout constraints
	 * like `UICorner`, `UIPadding`, `UIListLayout`, and `UIGridLayout` as child instances.
	 *
	 * Mirrors the architecture of Box.tsx but renders a native <scrollingframe> instead
	 * of a <frame>, with clean defaults for a modern scrolling experience.
	 *
	 * Usage:
	 *   <ScrollBox style={{ width: "100%", height: "300px", display: "flex", gap: "8px" }}>
	 *     <textlabel Text="Item 1" />
	 *     <textlabel Text="Item 2" />
	 *   </ScrollBox>
	 
]]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local useWebStyle = TS.import(script, script.Parent, "useWebStyle").useWebStyle
local ScrollBox = React.forwardRef(function(props, ref)
	local style = props.style
	local children = props.children
	local defaultProps = {
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		ScrollBarImageTransparency = 0.5,
		CanvasSize = UDim2.new(0, 0, 0, 0),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
	}
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.style = nil
	explicitProps.children = nil
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
		return React.createElement("scrollingframe", _attributes, parsedStyle.children, children)
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
	return React.createElement("scrollingframe", _attributes, children)
end)
return {
	ScrollBox = ScrollBox,
}
