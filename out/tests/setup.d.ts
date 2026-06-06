/**
 * Global test setup for roblox-css.
 *
 * This file runs once before all test files. It:
 * 1. Clears _G module markers to prevent roblox-ts RuntimeLib collisions
 *    when @rbxts/jest sandboxes test files via debug.loadmodule.
 * 2. Enables the React mock scheduler so act() works in headless tests.
 */
export {};
