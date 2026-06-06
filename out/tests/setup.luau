-- Compiled with roblox-ts v3.0.0
--[[
	*
	 * Global test setup for roblox-css.
	 *
	 * This file runs once before all test files. It:
	 * 1. Clears _G module markers to prevent roblox-ts RuntimeLib collisions
	 *    when @rbxts/jest sandboxes test files via debug.loadmodule.
	 * 2. Enables the React mock scheduler so act() works in headless tests.
	 
]]
local globalEnv = _G
-- Clear _G ownership markers set by roblox-ts RuntimeLib.
-- Without this, sandboxed RuntimeLib instances collide and throw:
-- "Invalid module access! Do you have multiple TS runtimes trying to import this?"
for key in globalEnv do
	if typeof(key) == "Instance" and key:IsA("ModuleScript") then
		globalEnv[key] = nil
	end
end
-- Enable React test scheduler for act() globally before any test imports React.
globalEnv.__ROACT_17_MOCK_SCHEDULER__ = true
return nil
