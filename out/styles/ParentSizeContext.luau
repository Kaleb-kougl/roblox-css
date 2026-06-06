-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
--[[
	*
	 * Carries the nearest ancestor <Box>'s AbsoluteSize as a binding,
	 * enabling children to reactively resolve percentage-based size constraints.
	 
]]
local ParentSizeContext = React.createContext(nil)
return {
	ParentSizeContext = ParentSizeContext,
}
