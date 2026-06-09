const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

/**
 * Tests for branded type helpers and branded object guarantees.
 *
 * Branded types use `& { readonly _parsed: unique symbol }` to prevent
 * accidental construction of ParsedColor / PaddingValues outside of
 * their respective helper functions. The brand is a compile-time guard
 * (unique symbol erases at runtime), so these tests verify:
 *
 *   1. Helper functions produce objects with the correct fields and values
 *   2. Return values from public parse functions are structurally correct
 *   3. Field values survive the as-any-as cast without corruption
 */

// ── Module imports via dynamic require ──────────────────────────────

interface ParsedColor {
	color: Color3;
	transparent: boolean;
	transparency: number;
}

interface PaddingValues {
	top: UDim;
	right: UDim;
	bottom: UDim;
	left: UDim;
}

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

const colorParserModule = require(uiStyles.WaitForChild("colorParser") as ModuleScript) as {
	parseColor: (input: string | Color3) => ParsedColor;
};
const parseColor = colorParserModule.parseColor;

const dimensionParserModule = require(uiStyles.WaitForChild("dimensionParser") as ModuleScript) as {
	parseDimension: (input: string | number) => UDim | undefined;
	parsePadding: (input: string | number) => PaddingValues;
};
const parseDimension = dimensionParserModule.parseDimension;
const parsePadding = dimensionParserModule.parsePadding;

// ── ParsedDimension branded type tests ─────────────────────────────

describe("ParsedDimension (branded type)", () => {
	describe("structure", () => {
		it("should return a value that is a UDim", () => {
			const result = parseDimension(100);

			expect(result).toBeDefined();
			expect(typeIs(result!, "UDim")).toBe(true);
		});

		it("should have Scale and Offset fields", () => {
			const result = parseDimension(42);

			expect(result).toBeDefined();
			expect(typeIs(result!.Scale, "number")).toBe(true);
			expect(typeIs(result!.Offset, "number")).toBe(true);
		});

		it("should not have a runtime _parsed field (brand erases)", () => {
			const result = parseDimension(10);

			// UDim is Roblox userdata — accessing an invalid member throws
			// rather than returning nil. The brand is compile-time only,
			// so attempting to read "_parsed" must error at runtime.
			const [ok] = pcall(() => {
				return (result as never as Record<string, unknown>)["_parsed"];
			});
			expect(ok).toBe(false);
		});
	});

	describe("helper produces correct values through the cast", () => {
		it("should preserve pixel values: number → UDim(0, n)", () => {
			const result = parseDimension(200);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(200);
		});

		it("should preserve percent values: '75%' → UDim(0.75, 0)", () => {
			const result = parseDimension("75%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.75, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should preserve pixel string values: '60px' → UDim(0, 60)", () => {
			const result = parseDimension("60px");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(60);
		});

		it("should preserve viewport values: '50vw' → UDim(0.5, 0)", () => {
			const result = parseDimension("50vw");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should preserve zero through the cast", () => {
			const result = parseDimension(0);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should preserve negative values through the cast", () => {
			const result = parseDimension(-25);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(-25);
		});
	});

	describe("auto returns undefined (no branded value)", () => {
		it("should return undefined for 'auto'", () => {
			const result = parseDimension("auto");

			expect(result).toBeUndefined();
		});
	});

	describe("fallback produces branded value", () => {
		it("should return a branded UDim(0, 0) for unrecognized input", () => {
			const result = parseDimension("banana");

			expect(result).toBeDefined();
			expect(typeIs(result!, "UDim")).toBe(true);
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});
	});

	describe("distinct instances (no shared state)", () => {
		it("should produce distinct UDim instances for each call", () => {
			const a = parseDimension(10);
			const b = parseDimension(20);

			expect(a).toBeDefined();
			expect(b).toBeDefined();
			expect(a).never.toBe(b);
		});

		it("should produce distinct instances even with same input", () => {
			const a = parseDimension(100);
			const b = parseDimension(100);

			expect(a).toBeDefined();
			expect(b).toBeDefined();
			// UDim values are equal but should be separate allocations
			expect(a!.Scale).toBe(b!.Scale);
			expect(a!.Offset).toBe(b!.Offset);
		});
	});
});

// ── ParsedColor branded type tests ──────────────────────────────────

describe("ParsedColor (branded type)", () => {
	describe("structure", () => {
		it("should have a 'color' field that is a Color3", () => {
			const result = parseColor("#ff0000");

			expect(typeIs(result.color, "Color3")).toBe(true);
		});

		it("should have a 'transparent' field that is a boolean", () => {
			const result = parseColor("#ff0000");

			expect(typeIs(result.transparent, "boolean")).toBe(true);
		});

		it("should only contain color and transparent fields", () => {
			const result = parseColor("red");
			const keys: string[] = [];

			for (const [key] of pairs(result as never as Record<string, unknown>)) {
				keys.push(key as string);
			}

			// Should have exactly 3 keys (color, transparent, and transparency)
			// The _parsed brand symbol does NOT exist at runtime
			expect(keys.size()).toBe(3);
			expect(keys.includes("color")).toBe(true);
			expect(keys.includes("transparent")).toBe(true);
			expect(keys.includes("transparency")).toBe(true);
		});
	});

	describe("helper produces correct values through the cast", () => {
		it("should preserve Color3 values through as-any-as cast", () => {
			const result = parseColor("#ff8800");
			const expected = Color3.fromRGB(255, 136, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should preserve transparent=false through the cast", () => {
			const result = parseColor("#000000");

			expect(result.transparent).toBe(false);
		});

		it("should preserve transparent=true through the cast", () => {
			const result = parseColor("transparent");

			expect(result.transparent).toBe(true);
		});

		it("should produce distinct objects for each call (no shared state)", () => {
			const a = parseColor("red");
			const b = parseColor("blue");

			expect(a).never.toBe(b);
			expect(a.color).never.toBe(b.color);
		});
	});

	describe("Color3 pass-through preserves identity", () => {
		it("should return the exact same Color3 instance (no clone)", () => {
			const input = Color3.fromRGB(42, 42, 42);
			const result = parseColor(input);

			// The helper wraps it but should keep the same Color3 reference
			expect(result.color).toBe(input);
		});
	});
});

// ── PaddingValues branded type tests ────────────────────────────────

describe("PaddingValues (branded type)", () => {
	describe("structure", () => {
		it("should have top, right, bottom, left fields as UDim", () => {
			const result = parsePadding(10);

			expect(typeIs(result.top, "UDim")).toBe(true);
			expect(typeIs(result.right, "UDim")).toBe(true);
			expect(typeIs(result.bottom, "UDim")).toBe(true);
			expect(typeIs(result.left, "UDim")).toBe(true);
		});

		it("should only contain the four padding fields", () => {
			const result = parsePadding(5);
			const keys: string[] = [];

			for (const [key] of pairs(result as never as Record<string, unknown>)) {
				keys.push(key as string);
			}

			// Should have exactly 4 keys — the _parsed brand erases at runtime
			expect(keys.size()).toBe(4);
			expect(keys.includes("top")).toBe(true);
			expect(keys.includes("right")).toBe(true);
			expect(keys.includes("bottom")).toBe(true);
			expect(keys.includes("left")).toBe(true);
		});
	});

	describe("helper produces correct values through the cast", () => {
		it("should set all sides to the same pixel UDim for number input", () => {
			const result = parsePadding(15);

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(15);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(15);
			expect(result.bottom.Scale).toBe(0);
			expect(result.bottom.Offset).toBe(15);
			expect(result.left.Scale).toBe(0);
			expect(result.left.Offset).toBe(15);
		});

		it("should preserve zero values through the cast", () => {
			const result = parsePadding(0);

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(0);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(0);
			expect(result.bottom.Scale).toBe(0);
			expect(result.bottom.Offset).toBe(0);
			expect(result.left.Scale).toBe(0);
			expect(result.left.Offset).toBe(0);
		});

		it("should preserve negative values through the cast", () => {
			const result = parsePadding(-5);

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(-5);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(-5);
			expect(result.bottom.Scale).toBe(0);
			expect(result.bottom.Offset).toBe(-5);
			expect(result.left.Scale).toBe(0);
			expect(result.left.Offset).toBe(-5);
		});

		it("should produce distinct objects for each call (no shared state)", () => {
			const a = parsePadding(10);
			const b = parsePadding(20);

			expect(a).never.toBe(b);
			expect(a.top.Offset).never.toBe(b.top.Offset);
		});
	});

	describe("CSS unit support via parseDimension", () => {
		it("should parse px tokens in shorthand", () => {
			const result = parsePadding("10px 20px");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(10);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(20);
			expect(result.bottom.Scale).toBe(0);
			expect(result.bottom.Offset).toBe(10);
			expect(result.left.Scale).toBe(0);
			expect(result.left.Offset).toBe(20);
		});

		it("should parse percent tokens in shorthand", () => {
			const result = parsePadding("10%");

			expect(result.top.Scale).toBeCloseTo(0.1, 5);
			expect(result.top.Offset).toBe(0);
		});

		it("should handle mixed units in 4-value shorthand", () => {
			const result = parsePadding("10px 50% 20px 25%");

			expect(result.top.Offset).toBe(10);
			expect(result.right.Scale).toBeCloseTo(0.5, 5);
			expect(result.bottom.Offset).toBe(20);
			expect(result.left.Scale).toBeCloseTo(0.25, 5);
		});
	});
});
