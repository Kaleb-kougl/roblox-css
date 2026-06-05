/**
 * Global test setup for roblox-css.
 *
 * This file runs once before all test files. It:
 * 1. Clears _G module markers to prevent roblox-ts RuntimeLib collisions
 *    when @rbxts/jest sandboxes test files via debug.loadmodule.
 * 2. Enables the React mock scheduler so act() works in headless tests.
 */

const globalEnv = _G as Map<unknown, unknown>;

// Clear _G ownership markers set by roblox-ts RuntimeLib.
// Without this, sandboxed RuntimeLib instances collide and throw:
// "Invalid module access! Do you have multiple TS runtimes trying to import this?"
for (const [key] of globalEnv) {
	if (typeIs(key, "Instance") && key.IsA("ModuleScript")) {
		globalEnv.delete(key);
	}
}

// Enable React test scheduler for act() globally before any test imports React.
(globalEnv as unknown as Record<string, unknown>).__ROACT_17_MOCK_SCHEDULER__ = true;
