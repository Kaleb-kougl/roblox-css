const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

interface ParsedGradient {
	colorSequence: ColorSequence;
	transparencySequence: NumberSequence | undefined;
	rotation: number;
}

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

const gradientParserModule = require(uiStyles.WaitForChild("gradientParser") as ModuleScript) as {
	parseGradient: (input: string, elementWidth?: number, elementHeight?: number) => ParsedGradient | undefined;
	isGradientString: (input: string) => boolean;
};
const parseGradient = gradientParserModule.parseGradient;
const isGradientString = gradientParserModule.isGradientString;

describe("gradientParser", () => {
	it("isGradientString", () => {
		expect(isGradientString("linear-gradient(to right, red, blue)")).toBe(true);
		expect(isGradientString("not-a-gradient")).toBe(false);
	});

	it("parseGradient simple", () => {
		const result = parseGradient("linear-gradient(to right, #ff0000, #0000ff)");
		expect(result).toBeDefined();
		expect(result!.rotation).toBe(0); // 90 - 90
		expect(result!.transparencySequence).toBeUndefined();
	});

	it("parseGradient corners with size", () => {
		const result = parseGradient("linear-gradient(to top right, red, blue)", 200, 100);
		expect(result).toBeDefined();
		// atan2(200, 100) = ~63.43 -> rotation = 63.43 - 90 = -26.565
		expect(result!.rotation).toBeCloseTo(-26.565, 2);
	});

	it("parseGradient with transparency", () => {
		const result = parseGradient("linear-gradient(to bottom, rgba(255, 0, 0, 0.5), rgba(0, 0, 255, 1))");
		expect(result).toBeDefined();
		expect(result!.transparencySequence).toBeDefined();
	});

	it("should return undefined for garbage input", () => {
		expect(parseGradient("")).toBeUndefined();
		expect(parseGradient("banana")).toBeUndefined();
		expect(parseGradient("radial-gradient(red, blue)")).toBeUndefined();
		expect(parseGradient("linear-gradient()")).toBeUndefined();
		expect(parseGradient("linear-gradient(red)")).toBeUndefined();
	});

	it("isGradientString rejects edge cases", () => {
		expect(isGradientString("")).toBe(false);
		expect(isGradientString("LINEAR-GRADIENT(red, blue)")).toBe(false);
		expect(isGradientString("linear-gradient")).toBe(false);
	});

	it("parseGradient three color stops", () => {
		const result = parseGradient("linear-gradient(to right, #ff0000, #00ff00, #0000ff)");
		expect(result).toBeDefined();
		expect(result!.rotation).toBe(0);
		expect(result!.transparencySequence).toBeUndefined();
	});

	it("parseGradient five color stops with explicit positions", () => {
		const result = parseGradient("linear-gradient(to bottom, red 0%, orange 25%, yellow 50%, green 75%, blue 100%)");
		expect(result).toBeDefined();
		expect(result!.rotation).toBe(90);
		expect(result!.transparencySequence).toBeUndefined();
	});

	it("parseGradient with turn unit", () => {
		const result = parseGradient("linear-gradient(0.25turn, red, blue)");
		expect(result).toBeDefined();
		expect(result!.rotation).toBe(0);
	});

	it("parseGradient with rad unit", () => {
		const result = parseGradient("linear-gradient(3.14159rad, red, blue)");
		expect(result).toBeDefined();
		expect(result!.rotation).toBeCloseTo(90, 0);
	});

	it("parseGradient corner keyword without dimensions defaults to 45deg", () => {
		const result = parseGradient("linear-gradient(to top right, red, blue)");
		expect(result).toBeDefined();
		expect(result!.rotation).toBe(-45);
	});

	it("parseGradient with color hint", () => {
		const result = parseGradient("linear-gradient(to right, red, 30%, blue)");
		expect(result).toBeDefined();
		expect(result!.rotation).toBe(0);
		expect(result!.colorSequence.Keypoints.size()).toBeGreaterThan(2);
	});

	it("should return undefined for repeating-linear-gradient", () => {
		expect(isGradientString("repeating-linear-gradient(red, blue)")).toBe(false);
		expect(parseGradient("repeating-linear-gradient(red, blue)")).toBeUndefined();
	});

	it("gradient with 25 color stops downsamples to exactly 20 keypoints", () => {
		const result = parseGradient(
			"linear-gradient(to right, #000000, #111111, #222222, #333333, #444444, #555555, #666666, #777777, #888888, #999999, #aaaaaa, #bbbbbb, #cccccc, #dddddd, #eeeeee, #ffffff, #110000, #220000, #330000, #440000, #550000, #660000, #770000, #880000, #990000)",
		);
		expect(result).toBeDefined();
		expect(result!.colorSequence.Keypoints.size()).toBe(20);
	});

	it("gradient with exactly 20 stops does not downsample", () => {
		const result = parseGradient(
			"linear-gradient(to right, #000000, #111111, #222222, #333333, #444444, #555555, #666666, #777777, #888888, #999999, #aaaaaa, #bbbbbb, #cccccc, #dddddd, #eeeeee, #ffffff, #110000, #220000, #330000, #440000)",
		);
		expect(result).toBeDefined();
		expect(result!.colorSequence.Keypoints.size()).toBe(20);
	});

	it("gradient with 21 stops downsamples and preserves first and last keypoints", () => {
		const result = parseGradient(
			"linear-gradient(to right, #000000, #111111, #222222, #333333, #444444, #555555, #666666, #777777, #888888, #999999, #aaaaaa, #bbbbbb, #cccccc, #dddddd, #eeeeee, #ffffff, #110000, #220000, #330000, #440000, #550000)",
		);
		expect(result).toBeDefined();
		expect(result!.colorSequence.Keypoints.size()).toBe(20);
		expect(result!.colorSequence.Keypoints[0].Time).toBe(0);
		expect(result!.colorSequence.Keypoints[result!.colorSequence.Keypoints.size() - 1].Time).toBe(1);
	});
});
