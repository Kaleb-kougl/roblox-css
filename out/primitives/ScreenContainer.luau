-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * ScreenContainer.tsx — A ScreenGui wrapper for on-screen Roblox UI.
	 *
	 * Provides the top-level container that should be parented into StarterGui or
	 * PlayerGui by the consuming experience. Descendant primitives remain ordinary
	 * GuiObjects such as Frame, TextLabel, TextButton, and ScrollingFrame.
	 
]]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local function makeScreenContainerProps(props)
	return props
end
local ScreenContainer = React.forwardRef(function(props, ref)
	local children = props.children
	local defaultProps = {
		Enabled = true,
		DisplayOrder = 0,
		ResetOnSpawn = false,
		ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	}
	local _object = table.clone(props)
	setmetatable(_object, nil)
	local explicitProps = _object
	explicitProps.children = nil
	local _attributes = {
		ref = ref,
	}
	for _k, _v in defaultProps do
		_attributes[_k] = _v
	end
	for _k, _v in explicitProps do
		_attributes[_k] = _v
	end
	return React.createElement("screengui", _attributes, children)
end)
return {
	makeScreenContainerProps = makeScreenContainerProps,
	ScreenContainer = ScreenContainer,
}
