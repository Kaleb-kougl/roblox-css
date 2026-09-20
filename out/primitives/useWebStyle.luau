-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--[[
	*
	 * useWebStyle.ts — Render-stable wrapper around webStyle().
	 *
	 * webStyle() walks the entire CSSProperties table and allocates fresh prop
	 * tables plus constraint elements (<uicorner>, <uipadding>, <uilistlayout>…)
	 * on every call. Calling it directly in a component body pays that cost on
	 * every render, not just on mount.
	 *
	 * This hook caches the last parse and reuses it while the style is unchanged.
	 *
	 * The cache key is a shallow VALUE comparison, not table identity, because the
	 * common usage passes a fresh table every render:
	 *
	 *   <Text style={{ color: "white", fontSize: "18px" }} />
	 *
	 * Under an identity check (`useMemo(..., [style])`) that call site would miss
	 * on every render and the hook would buy nothing. CSSProperties is flat —
	 * every value is a string, number or boolean — so comparing own keys is an
	 * exact equality check, not an approximation.
	 *
	 * The cached style is stored as a copy so that a caller mutating its own style
	 * table in place cannot produce a false cache hit.
	 
]]
local useRef = TS.import(script, TS.getModule(script, "@rbxts", "react")).useRef
local webStyle = TS.import(script, script.Parent.Parent, "styles", "webStyle").webStyle
--* Exact equality for flat CSSProperties tables: same own keys, same values. 
local function shallowEqual(a, b)
	for key, value in pairs(a) do
		if b[key] ~= value then
			return false
		end
	end
	-- Catch keys present in `b` but absent from `a` (nil values are not
	-- enumerated by pairs, so a key-count check alone would be unsound).
	for key in pairs(b) do
		if a[key] == nil then
			return false
		end
	end
	return true
end
local function copyStyle(style)
	local copy = {}
	for key, value in pairs(style) do
		copy[key] = value
	end
	return copy
end
local function useWebStyle(style, hostText)
	-- Called unconditionally — the early return below happens after the hook.
	local cache = useRef()
	if style == nil then
		return nil
	end
	local nextStyle = style
	local prev = cache.current
	if prev ~= nil and prev.hostText == hostText and shallowEqual(prev.style, nextStyle) then
		return prev.result
	end
	local result = webStyle(style, hostText)
	cache.current = {
		style = copyStyle(nextStyle),
		hostText = hostText,
		result = result,
	}
	return result
end
return {
	useWebStyle = useWebStyle,
}
