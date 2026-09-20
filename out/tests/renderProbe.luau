-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * renderProbe.ts — Test helper for forwardRef primitives that call hooks.
	 *
	 * Several specs assert on the *element* a primitive returns rather than on a
	 * mounted instance, by calling `Component.render(props, ref)` directly. That
	 * works only while the component is hook-free: React installs its hook
	 * dispatcher for the duration of a render pass, so a `useRef` reached from
	 * outside one throws "Invalid hook call".
	 *
	 * The primitives call useWebStyle() to cache style parsing, so this helper
	 * supplies the missing render context — a probe component invokes the render
	 * function during its own render and we capture what it returned, without
	 * mounting that element. The element-shape assertions stay exactly as written.
	 
]]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local function renderElement(render, props, ref)
	if ref == nil then
		ref = nil
	end
	local captured
	local Probe = function()
		captured = render(props, ref)
		-- The captured element is inspected, not mounted.
		return nil
	end
	local container = Instance.new("Folder")
	local root = ReactRoblox.createRoot(container)
	ReactRoblox.act(function()
		root:render(React.createElement(Probe))
	end)
	ReactRoblox.act(function()
		root:unmount()
	end)
	container:Destroy()
	return captured
end
return {
	renderElement = renderElement,
}
