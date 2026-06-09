const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

describe("namedColors types", () => {
	const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
	const stylesFolder = robloxCSS.WaitForChild("styles");
	const namedColorsModule = require(stylesFolder.WaitForChild("namedColors") as ModuleScript) as {
		NAMED_COLORS: Map<string, [number, number, number]>;
	};

	describe("NAMED_COLORS", () => {
		it("should exist and be a table", () => {
			expect(namedColorsModule.NAMED_COLORS).toBeDefined();
			expect(typeIs(namedColorsModule.NAMED_COLORS, "table")).toBe(true);
		});

		it("should contain standard CSS colors", () => {
			expect(namedColorsModule.NAMED_COLORS.has("red")).toBe(true);
			expect(namedColorsModule.NAMED_COLORS.has("blue")).toBe(true);
			expect(namedColorsModule.NAMED_COLORS.has("green")).toBe(true);
			expect(namedColorsModule.NAMED_COLORS.has("white")).toBe(true);
			expect(namedColorsModule.NAMED_COLORS.has("black")).toBe(true);
		});

		it("should return correct RGB values for colors", () => {
			const red = namedColorsModule.NAMED_COLORS.get("red");
			expect(red).toBeDefined();
			expect(red![0]).toBe(255);
			expect(red![1]).toBe(0);
			expect(red![2]).toBe(0);

			const white = namedColorsModule.NAMED_COLORS.get("white");
			expect(white).toBeDefined();
			expect(white![0]).toBe(255);
			expect(white![1]).toBe(255);
			expect(white![2]).toBe(255);
		});

		it("should not contain any colors", () => {
			expect(namedColorsModule.NAMED_COLORS.has("unknowncolor")).toBe(false);
			expect(namedColorsModule.NAMED_COLORS.has("madeup")).toBe(false);
		});

		it("should be case-sensitive based on lowercase keys", () => {
			// The map uses lowercase keys, so uppercase should not exist directly on the map
			expect(namedColorsModule.NAMED_COLORS.has("Red")).toBe(false);
			expect(namedColorsModule.NAMED_COLORS.has("RED")).toBe(false);
		});
	});
});
