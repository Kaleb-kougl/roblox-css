const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

const transitionsModule = require(uiStyles.WaitForChild("transitions") as ModuleScript) as {
	transitions: Record<string, TweenInfo>;
};

const transitions = transitionsModule.transitions;

describe("Transitions", () => {
	it("should export default standard transitions", () => {
		expect(transitions.default).toBeDefined();
		expect(transitions.default.Time).toBeCloseTo(0.3, 5);
		expect(transitions.default.EasingStyle).toBe(Enum.EasingStyle.Quad);
	});

	it("should export pop transition", () => {
		expect(transitions.pop).toBeDefined();
		expect(transitions.pop.Time).toBeCloseTo(0.25, 5);
		expect(transitions.pop.EasingStyle).toBe(Enum.EasingStyle.Back);
	});

	it("should export breathe transition", () => {
		expect(transitions.breathe).toBeDefined();
		expect(transitions.breathe.Time).toBeCloseTo(2, 5);
		expect(transitions.breathe.EasingStyle).toBe(Enum.EasingStyle.Sine);
		expect(transitions.breathe.Reverses).toBe(true);
	});

	it("should export snap transition", () => {
		expect(transitions.snap).toBeDefined();
		expect(transitions.snap.Time).toBeCloseTo(0.1, 5);
		expect(transitions.snap.EasingStyle).toBe(Enum.EasingStyle.Linear);
	});

	it("should export shimmer transition", () => {
		expect(transitions.shimmer).toBeDefined();
		expect(transitions.shimmer.Time).toBeCloseTo(1, 5);
		expect(transitions.shimmer.EasingStyle).toBe(Enum.EasingStyle.Linear);
	});
});
