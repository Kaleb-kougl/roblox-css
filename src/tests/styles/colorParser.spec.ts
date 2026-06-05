const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

interface ParsedColor {
	color: Color3;
	transparent: boolean;
	transparency: number;
}

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

const colorParserModule = require(uiStyles.WaitForChild("colorParser") as ModuleScript) as {
	parseColor: (input: string | Color3) => ParsedColor;
};
const parseColor = colorParserModule.parseColor;

describe("colorParser", () => {
	// ── Color3 pass-through ──────────────────────────────────────────

	describe("Color3 pass-through", () => {
		it("should return the same Color3 instance unchanged", () => {
			const input = Color3.fromRGB(123, 45, 67);
			const result = parseColor(input);

			expect(result.color).toBe(input);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should handle Color3(0, 0, 0) (black)", () => {
			const input = new Color3(0, 0, 0);
			const result = parseColor(input);

			expect(result.color).toBe(input);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should handle Color3(1, 1, 1) (white)", () => {
			const input = new Color3(1, 1, 1);
			const result = parseColor(input);

			expect(result.color).toBe(input);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});
	});

	// ── Transparent keyword ──────────────────────────────────────────

	describe("transparent keyword", () => {
		it("should return white with transparent: true", () => {
			const result = parseColor("transparent");

			expect(result.color.R).toBe(1);
			expect(result.color.G).toBe(1);
			expect(result.color.B).toBe(1);
			expect(result.transparent).toBe(true);
			expect(result.transparency).toBe(1);
		});

		it("should not match 'Transparent' (case-sensitive)", () => {
			// "Transparent" with capital T falls through to named color lookup,
			// which lowercases it. "transparent" is not in NAMED_COLORS,
			// so it hits the fallback path.
			const result = parseColor("Transparent");

			// Should hit fallback (warn + white), NOT the transparent branch
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});
	});

	// ── Hex colors (6-char) ──────────────────────────────────────────

	describe("6-char hex (#RRGGBB)", () => {
		it("should parse #ff0000 as red", () => {
			const result = parseColor("#ff0000");

			expect(result.color.R).toBeCloseTo(1, 2);
			expect(result.color.G).toBeCloseTo(0, 2);
			expect(result.color.B).toBeCloseTo(0, 2);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse ff0000 as red (without #)", () => {
			const result = parseColor("ff0000");

			expect(result.color.R).toBeCloseTo(1, 2);
			expect(result.color.G).toBeCloseTo(0, 2);
			expect(result.color.B).toBeCloseTo(0, 2);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse #00ff00 as green", () => {
			const result = parseColor("#00ff00");

			expect(result.color.R).toBeCloseTo(0, 2);
			expect(result.color.G).toBeCloseTo(1, 2);
			expect(result.color.B).toBeCloseTo(0, 2);
		});

		it("should parse #0000ff as blue", () => {
			const result = parseColor("#0000ff");

			expect(result.color.R).toBeCloseTo(0, 2);
			expect(result.color.G).toBeCloseTo(0, 2);
			expect(result.color.B).toBeCloseTo(1, 2);
		});

		it("should parse #000000 as black", () => {
			const result = parseColor("#000000");

			expect(result.color.R).toBe(0);
			expect(result.color.G).toBe(0);
			expect(result.color.B).toBe(0);
		});

		it("should parse #ffffff as white", () => {
			const result = parseColor("#ffffff");

			expect(result.color.R).toBeCloseTo(1, 2);
			expect(result.color.G).toBeCloseTo(1, 2);
			expect(result.color.B).toBeCloseTo(1, 2);
		});

		it("should parse mixed hex #23232D", () => {
			const result = parseColor("#23232D");
			// 0x23 = 35, 0x2D = 45
			const expected = Color3.fromRGB(35, 35, 45);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse uppercase hex #FF8800", () => {
			const result = parseColor("#FF8800");
			const expected = Color3.fromRGB(255, 136, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});
	});

	// ── Hex colors (3-char shorthand) ────────────────────────────────

	describe("3-char hex (#RGB)", () => {
		it("should parse #f00 as red (ff0000)", () => {
			const result = parseColor("#f00");
			const expected = Color3.fromRGB(255, 0, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse f00 as red without #", () => {
			const result = parseColor("f00");
			const expected = Color3.fromRGB(255, 0, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse #0f0 as green (00ff00)", () => {
			const result = parseColor("#0f0");
			const expected = Color3.fromRGB(0, 255, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse #fff as white (ffffff)", () => {
			const result = parseColor("#fff");
			const expected = Color3.fromRGB(255, 255, 255);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should double each digit: #abc → #aabbcc", () => {
			const result = parseColor("#abc");
			// a=10 → aa=170, b=11 → bb=187, c=12 → cc=204
			const expected = Color3.fromRGB(170, 187, 204);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});
	});

	// ── Hex edge cases ───────────────────────────────────────────────

	describe("hex edge cases", () => {
		it("should return white for invalid hex length (#ab)", () => {
			// 3 chars total → doesn't match size 4 or 7
			const result = parseColor("#ab");

			expect(result.color.R).toBe(1);
			expect(result.color.G).toBe(1);
			expect(result.color.B).toBe(1);
		});

		it("should return white for overly long hex (#aabbccdd)", () => {
			// 9 chars → doesn't match size 4 or 7
			const result = parseColor("#aabbccdd");

			expect(result.color.R).toBe(1);
			expect(result.color.G).toBe(1);
			expect(result.color.B).toBe(1);
		});
	});

	// ── RGB function ─────────────────────────────────────────────────

	describe("rgb() function", () => {
		it("should parse rgb(255, 0, 0) as red", () => {
			const result = parseColor("rgb(255, 0, 0)");
			const expected = Color3.fromRGB(255, 0, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse rgb(0, 128, 255)", () => {
			const result = parseColor("rgb(0, 128, 255)");
			const expected = Color3.fromRGB(0, 128, 255);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse rgb(0, 0, 0) as black", () => {
			const result = parseColor("rgb(0, 0, 0)");

			expect(result.color.R).toBe(0);
			expect(result.color.G).toBe(0);
			expect(result.color.B).toBe(0);
		});

		it("should parse rgb with no spaces: rgb(34,197,94)", () => {
			const result = parseColor("rgb(34,197,94)");
			const expected = Color3.fromRGB(34, 197, 94);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse rgb with extra spaces: rgb( 59 , 130 , 246 )", () => {
			const result = parseColor("rgb( 59 , 130 , 246 )");
			const expected = Color3.fromRGB(59, 130, 246);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});
	});

	// ── RGBA function ────────────────────────────────────────────────
	
	describe("rgba() function", () => {
		it("should parse rgba(255, 0, 0, 0.5) as red with 0.5 transparency", () => {
			const result = parseColor("rgba(255, 0, 0, 0.5)");
			const expected = Color3.fromRGB(255, 0, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBeCloseTo(0.5, 3);
		});

		it("should parse rgba(0, 128, 255, 0) as fully transparent blue", () => {
			const result = parseColor("rgba(0, 128, 255, 0)");
			
			expect(result.transparent).toBe(true);
			expect(result.transparency).toBeCloseTo(1, 3);
		});
		
		it("should parse rgba(0, 128, 255, 1) as fully opaque blue", () => {
			const result = parseColor("rgba(0, 128, 255, 1)");
			
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBeCloseTo(0, 3);
		});
	});

	// ── Named colors ─────────────────────────────────────────────────

	describe("named colors", () => {
		it("should parse 'red' as (255, 0, 0)", () => {
			const result = parseColor("red");
			const expected = Color3.fromRGB(255, 0, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse 'blue' as (0, 0, 255)", () => {
			const result = parseColor("blue");
			const expected = Color3.fromRGB(0, 0, 255);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse 'white' as (255, 255, 255)", () => {
			const result = parseColor("white");
			const expected = Color3.fromRGB(255, 255, 255);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should be case-insensitive: 'Red' → red", () => {
			const result = parseColor("Red");
			const expected = Color3.fromRGB(255, 0, 0);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should be case-insensitive: 'CORNFLOWERBLUE' → cornflowerblue", () => {
			const result = parseColor("CORNFLOWERBLUE");
			const expected = Color3.fromRGB(100, 149, 237);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});

		it("should parse 'rebeccapurple' as (102, 51, 153)", () => {
			const result = parseColor("rebeccapurple");
			const expected = Color3.fromRGB(102, 51, 153);

			expect(result.color.R).toBeCloseTo(expected.R, 3);
			expect(result.color.G).toBeCloseTo(expected.G, 3);
			expect(result.color.B).toBeCloseTo(expected.B, 3);
		});
	});

	// ── Fallback ─────────────────────────────────────────────────────

	describe("fallback (any input)", () => {
		it("should return white for any color name", () => {
			const result = parseColor("notacolor");

			expect(result.color.R).toBe(1);
			expect(result.color.G).toBe(1);
			expect(result.color.B).toBe(1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should return white for empty string", () => {
			const result = parseColor("");

			expect(result.color.R).toBe(1);
			expect(result.color.G).toBe(1);
			expect(result.color.B).toBe(1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});
	});

	// ── HSL function ─────────────────────────────────────────────────

	describe("hsl() function", () => {
		it("should parse hsl(0, 100%, 50%) as red", () => {
			const result = parseColor("hsl(0, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(1, 1);
			expect(result.color.G).toBeCloseTo(0, 1);
			expect(result.color.B).toBeCloseTo(0, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(120, 100%, 50%) as green", () => {
			const result = parseColor("hsl(120, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(0, 1);
			expect(result.color.G).toBeCloseTo(1, 1);
			expect(result.color.B).toBeCloseTo(0, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(240, 100%, 50%) as blue", () => {
			const result = parseColor("hsl(240, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(0, 1);
			expect(result.color.G).toBeCloseTo(0, 1);
			expect(result.color.B).toBeCloseTo(1, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(0, 0%, 0%) as black", () => {
			const result = parseColor("hsl(0, 0%, 0%)");

			expect(result.color.R).toBe(0);
			expect(result.color.G).toBe(0);
			expect(result.color.B).toBe(0);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(0, 0%, 100%) as white", () => {
			const result = parseColor("hsl(0, 0%, 100%)");

			expect(result.color.R).toBeCloseTo(1, 1);
			expect(result.color.G).toBeCloseTo(1, 1);
			expect(result.color.B).toBeCloseTo(1, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(0, 0%, 50%) as gray (0% saturation)", () => {
			const result = parseColor("hsl(0, 0%, 50%)");

			expect(result.color.R).toBeCloseTo(0.5, 1);
			expect(result.color.G).toBeCloseTo(0.5, 1);
			expect(result.color.B).toBeCloseTo(0.5, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(60, 100%, 50%) as yellow", () => {
			const result = parseColor("hsl(60, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(1, 1);
			expect(result.color.G).toBeCloseTo(1, 1);
			expect(result.color.B).toBeCloseTo(0, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(180, 100%, 50%) as cyan", () => {
			const result = parseColor("hsl(180, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(0, 1);
			expect(result.color.G).toBeCloseTo(1, 1);
			expect(result.color.B).toBeCloseTo(1, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should parse hsl(300, 100%, 50%) as magenta", () => {
			const result = parseColor("hsl(300, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(1, 1);
			expect(result.color.G).toBeCloseTo(0, 1);
			expect(result.color.B).toBeCloseTo(1, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should normalize negative hue: hsl(-30, 100%, 50%) → 330°", () => {
			const result = parseColor("hsl(-30, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(1, 1);
			expect(result.color.G).toBeCloseTo(0, 1);
			expect(result.color.B).toBeCloseTo(0.5, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});

		it("should normalize overflow hue: hsl(480, 100%, 50%) → 120° (green)", () => {
			const result = parseColor("hsl(480, 100%, 50%)");

			expect(result.color.R).toBeCloseTo(0, 1);
			expect(result.color.G).toBeCloseTo(1, 1);
			expect(result.color.B).toBeCloseTo(0, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});
	});

	// ── HSLA function ────────────────────────────────────────────────

	describe("hsla() function", () => {
		it("should parse hsla(0, 100%, 50%, 0.5) as red with 0.5 transparency", () => {
			const result = parseColor("hsla(0, 100%, 50%, 0.5)");

			expect(result.color.R).toBeCloseTo(1, 1);
			expect(result.color.G).toBeCloseTo(0, 1);
			expect(result.color.B).toBeCloseTo(0, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBeCloseTo(0.5, 1);
		});

		it("should parse hsla(120, 100%, 50%, 0) as green fully transparent", () => {
			const result = parseColor("hsla(120, 100%, 50%, 0)");

			expect(result.color.R).toBeCloseTo(0, 1);
			expect(result.color.G).toBeCloseTo(1, 1);
			expect(result.color.B).toBeCloseTo(0, 1);
			expect(result.transparent).toBe(true);
			expect(result.transparency).toBe(1);
		});

		it("should parse hsla(240, 100%, 50%, 1) as blue fully opaque", () => {
			const result = parseColor("hsla(240, 100%, 50%, 1)");

			expect(result.color.R).toBeCloseTo(0, 1);
			expect(result.color.G).toBeCloseTo(0, 1);
			expect(result.color.B).toBeCloseTo(1, 1);
			expect(result.transparent).toBe(false);
			expect(result.transparency).toBe(0);
		});
	});
});
