-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * transitions.ts — Pre-configured animation transitions for Motion primitives.
	 *
	 * Provides a standardized set of TweenInfo configurations to ensure consistency
	 * across all declarative animations, per ADR-0002.
	 
]]
local transitions = {
	default = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
	pop = TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
	breathe = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
	snap = TweenInfo.new(0.1, Enum.EasingStyle.Linear),
	shimmer = TweenInfo.new(1, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1),
}
return {
	transitions = transitions,
}
