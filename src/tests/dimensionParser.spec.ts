const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

// ParsedDimension is UDim & brand at compile time, plain UDim at runtime
const dimensionParserModule = require(uiStyles.WaitForChild("dimensionParser") as ModuleScript) as {
	parseDimension: (input: string | number) => UDim | undefined;
	parsePadding: (input: string | number) => {
		top: UDim;
		right: UDim;
		bottom: UDim;
		left: UDim;
	};
};
const parseDimension = dimensionParserModule.parseDimension;
const parsePadding = dimensionParserModule.parsePadding;

describe("parseDimension", () => {
	// ── Number input (pixels) ───────────────────────────────────────

	describe("number input (pixels)", () => {
		it("should treat a number as pixel offset → UDim(0, n)", () => {
			const result = parseDimension(100);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(100);
		});

		it("should handle 0", () => {
			const result = parseDimension(0);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should handle negative numbers", () => {
			const result = parseDimension(-50);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(-50);
		});

		it("should handle decimal numbers (Roblox truncates Offset to int)", () => {
			const result = parseDimension(12.5);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(12); // UDim.Offset is integer-only
		});
	});

	// ── Pixel strings ("px") ────────────────────────────────────────

	describe("pixel strings (px)", () => {
		it("should parse '100px' → UDim(0, 100)", () => {
			const result = parseDimension("100px");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(100);
		});

		it("should parse '0px' → UDim(0, 0)", () => {
			const result = parseDimension("0px");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '250px' → UDim(0, 250)", () => {
			const result = parseDimension("250px");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(250);
		});

		it("should parse '-10px' → UDim(0, -10)", () => {
			const result = parseDimension("-10px");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(-10);
		});

		it("should parse '12.5px' → UDim(0, 12) (Roblox truncates Offset)", () => {
			const result = parseDimension("12.5px");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(12); // UDim.Offset is integer-only
		});
	});

	// ── Percent strings ─────────────────────────────────────────────

	describe("percent strings (%)", () => {
		it("should parse '50%' → UDim(0.5, 0)", () => {
			const result = parseDimension("50%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '100%' → UDim(1, 0)", () => {
			const result = parseDimension("100%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(1, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '0%' → UDim(0, 0)", () => {
			const result = parseDimension("0%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '25%' → UDim(0.25, 0)", () => {
			const result = parseDimension("25%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.25, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '33.3%' → UDim(0.333, 0)", () => {
			const result = parseDimension("33.3%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.333, 3);
			expect(result!.Offset).toBe(0);
		});
	});

	// ── Percentage parsing for constraints ──────────────────────────

	describe("percentage parsing for constraints", () => {
		it("parses '50%' to Scale=0.5, Offset=0", () => {
			const result = parseDimension("50%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(0);
		});

		it("parses '100%' to Scale=1.0, Offset=0", () => {
			const result = parseDimension("100%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(1.0, 5);
			expect(result!.Offset).toBe(0);
		});

		it("parses '0%' to Scale=0, Offset=0", () => {
			const result = parseDimension("0%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("parses '33.33%' to Scale≈0.3333", () => {
			const result = parseDimension("33.33%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.3333, 4);
			expect(result!.Offset).toBe(0);
		});

		it("parses '200%' to Scale=2.0", () => {
			const result = parseDimension("200%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(2.0, 5);
			expect(result!.Offset).toBe(0);
		});

		it("pixel values have Scale=0", () => {
			const result = parseDimension("200px");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(200);
		});

		it("numeric values have Scale=0", () => {
			const result = parseDimension(400);

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(400);
		});
	});

	// ── Viewport units (vw / vh) ────────────────────────────────────

	describe("viewport units (vw / vh)", () => {
		it("should parse '100vw' → UDim(1, 0)", () => {
			const result = parseDimension("100vw");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(1, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '100vh' → UDim(1, 0)", () => {
			const result = parseDimension("100vh");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(1, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '50vw' → UDim(0.5, 0)", () => {
			const result = parseDimension("50vw");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '50vh' → UDim(0.5, 0)", () => {
			const result = parseDimension("50vh");

			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(0);
		});

		it("should parse '0vw' → UDim(0, 0)", () => {
			const result = parseDimension("0vw");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});
	});

	// ── Auto keyword ────────────────────────────────────────────────

	describe("auto keyword", () => {
		it("should return undefined for 'auto'", () => {
			const result = parseDimension("auto");

			expect(result).toBeUndefined();
		});
	});

	// ── calc() expressions ──────────────────────────────────────────
	describe("calc() expressions", () => {
		it("should parse 'calc(100% - 10px)' → UDim(1.0, -10)", () => {
			const result = parseDimension("calc(100% - 10px)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(1.0, 5);
			expect(result!.Offset).toBe(-10);
		});
		it("should parse 'calc(50% + 20px)' → UDim(0.5, 20)", () => {
			const result = parseDimension("calc(50% + 20px)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(20);
		});
		it("should parse 'calc(100% - 0px)' → UDim(1.0, 0)", () => {
			const result = parseDimension("calc(100% - 0px)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(1.0, 5);
			expect(result!.Offset).toBe(0);
		});
		it("should parse 'calc(0% + 10px)' → UDim(0, 10)", () => {
			const result = parseDimension("calc(0% + 10px)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(10);
		});
		it("should parse 'calc(50% - 50px)' → UDim(0.5, -50)", () => {
			const result = parseDimension("calc(50% - 50px)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(-50);
		});
		it("should handle reversed order 'calc(10px + 50%)'", () => {
			const result = parseDimension("calc(10px + 50%)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(0.5, 5);
			expect(result!.Offset).toBe(10);
		});
		it("should handle reversed subtraction 'calc(10px - 50%)'", () => {
			const result = parseDimension("calc(10px - 50%)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(-0.5, 5);
			expect(result!.Offset).toBe(10);
		});
		it("should fallback for malformed calc 'calc(banana)'", () => {
			const result = parseDimension("calc(banana)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});
		it("should fallback for empty calc 'calc()'", () => {
			const result = parseDimension("calc()");
			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});
		it("should parse 'calc(100% + 0px)' → UDim(1.0, 0)", () => {
			const result = parseDimension("calc(100% + 0px)");
			expect(result).toBeDefined();
			expect(result!.Scale).toBeCloseTo(1.0, 5);
			expect(result!.Offset).toBe(0);
		});
	});

	// ── Fallback (any input) ────────────────────────────────────

	describe("fallback (any input)", () => {
		it("should return UDim(0, 0) for an unrecognized string", () => {
			const result = parseDimension("banana");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should return UDim(0, 0) for empty string", () => {
			const result = parseDimension("");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should return UDim(0, 0) for malformed px string 'abcpx'", () => {
			const result = parseDimension("abcpx");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should return UDim(0, 0) for malformed percent 'abc%'", () => {
			const result = parseDimension("abc%");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should return UDim(0, 0) for 'garbage' string", () => {
			const result = parseDimension("garbage");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});

		it("should return UDim(0, 0) for special characters '!@#$'", () => {
			const result = parseDimension("!@#$");

			expect(result).toBeDefined();
			expect(result!.Scale).toBe(0);
			expect(result!.Offset).toBe(0);
		});
	});
});

// ── parsePadding ────────────────────────────────────────────────────

describe("parsePadding", () => {
	// ── Number input ────────────────────────────────────────────────

	describe("number input (uniform pixel padding)", () => {
		it("should apply the same pixel UDim to all four sides", () => {
			const result = parsePadding(20);

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(20);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(20);
			expect(result.bottom.Scale).toBe(0);
			expect(result.bottom.Offset).toBe(20);
			expect(result.left.Scale).toBe(0);
			expect(result.left.Offset).toBe(20);
		});

		it("should handle 0", () => {
			const result = parsePadding(0);

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(0);
			expect(result.right.Offset).toBe(0);
			expect(result.bottom.Offset).toBe(0);
			expect(result.left.Offset).toBe(0);
		});

		it("should handle negative numbers", () => {
			const result = parsePadding(-8);

			expect(result.top.Offset).toBe(-8);
			expect(result.right.Offset).toBe(-8);
			expect(result.bottom.Offset).toBe(-8);
			expect(result.left.Offset).toBe(-8);
		});
	});

	// ── 1 value shorthand ───────────────────────────────────────────

	describe("1-value shorthand (all sides)", () => {
		it("should parse '16px' to all sides", () => {
			const result = parsePadding("16px");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(16);
			expect(result.right.Offset).toBe(16);
			expect(result.bottom.Offset).toBe(16);
			expect(result.left.Offset).toBe(16);
		});

		it("should parse '50%' to all sides", () => {
			const result = parsePadding("50%");

			expect(result.top.Scale).toBeCloseTo(0.5, 5);
			expect(result.top.Offset).toBe(0);
			expect(result.right.Scale).toBeCloseTo(0.5, 5);
			expect(result.bottom.Scale).toBeCloseTo(0.5, 5);
			expect(result.left.Scale).toBeCloseTo(0.5, 5);
		});

		it("should parse '100vw' to all sides", () => {
			const result = parsePadding("100vw");

			expect(result.top.Scale).toBeCloseTo(1, 5);
			expect(result.right.Scale).toBeCloseTo(1, 5);
			expect(result.bottom.Scale).toBeCloseTo(1, 5);
			expect(result.left.Scale).toBeCloseTo(1, 5);
		});
	});

	// ── 2 value shorthand ───────────────────────────────────────────

	describe("2-value shorthand (vertical | horizontal)", () => {
		it("should parse '10px 20px' → top/bottom=10, right/left=20", () => {
			const result = parsePadding("10px 20px");

			expect(result.top.Offset).toBe(10);
			expect(result.right.Offset).toBe(20);
			expect(result.bottom.Offset).toBe(10);
			expect(result.left.Offset).toBe(20);
		});

		it("should parse '25% 50%' → top/bottom=0.25, right/left=0.5", () => {
			const result = parsePadding("25% 50%");

			expect(result.top.Scale).toBeCloseTo(0.25, 5);
			expect(result.right.Scale).toBeCloseTo(0.5, 5);
			expect(result.bottom.Scale).toBeCloseTo(0.25, 5);
			expect(result.left.Scale).toBeCloseTo(0.5, 5);
		});

		it("should handle mixed units: '10px 50%'", () => {
			const result = parsePadding("10px 50%");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(10);
			expect(result.right.Scale).toBeCloseTo(0.5, 5);
			expect(result.right.Offset).toBe(0);
			expect(result.bottom.Offset).toBe(10);
			expect(result.left.Scale).toBeCloseTo(0.5, 5);
		});
	});

	// ── 3 value shorthand ───────────────────────────────────────────

	describe("3-value shorthand (top | horizontal | bottom)", () => {
		it("should parse '10px 20px 30px' → top=10, right/left=20, bottom=30", () => {
			const result = parsePadding("10px 20px 30px");

			expect(result.top.Offset).toBe(10);
			expect(result.right.Offset).toBe(20);
			expect(result.bottom.Offset).toBe(30);
			expect(result.left.Offset).toBe(20);
		});

		it("should mirror horizontal to left: '5px 15px 25px'", () => {
			const result = parsePadding("5px 15px 25px");

			expect(result.left.Offset).toBe(15);
			expect(result.right.Offset).toBe(15);
		});

		it("should handle mixed units: '10% 20px 30%'", () => {
			const result = parsePadding("10% 20px 30%");

			expect(result.top.Scale).toBeCloseTo(0.1, 5);
			expect(result.top.Offset).toBe(0);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(20);
			expect(result.bottom.Scale).toBeCloseTo(0.3, 5);
			expect(result.left.Offset).toBe(20);
		});
	});

	// ── 4 value shorthand ───────────────────────────────────────────

	describe("4-value shorthand (top | right | bottom | left)", () => {
		it("should parse '10px 20px 30px 40px' → clockwise assignment", () => {
			const result = parsePadding("10px 20px 30px 40px");

			expect(result.top.Offset).toBe(10);
			expect(result.right.Offset).toBe(20);
			expect(result.bottom.Offset).toBe(30);
			expect(result.left.Offset).toBe(40);
		});

		it("should handle all percent: '10% 20% 30% 40%'", () => {
			const result = parsePadding("10% 20% 30% 40%");

			expect(result.top.Scale).toBeCloseTo(0.1, 5);
			expect(result.right.Scale).toBeCloseTo(0.2, 5);
			expect(result.bottom.Scale).toBeCloseTo(0.3, 5);
			expect(result.left.Scale).toBeCloseTo(0.4, 5);
		});

		it("should handle mixed units: '10px 50% 20px 25vh'", () => {
			const result = parsePadding("10px 50% 20px 25vh");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(10);
			expect(result.right.Scale).toBeCloseTo(0.5, 5);
			expect(result.right.Offset).toBe(0);
			expect(result.bottom.Offset).toBe(20);
			expect(result.left.Scale).toBeCloseTo(0.25, 5);
		});

		it("should assign each side independently (no shared references)", () => {
			const result = parsePadding("1px 2px 3px 4px");

			expect(result.top.Offset).toBe(1);
			expect(result.right.Offset).toBe(2);
			expect(result.bottom.Offset).toBe(3);
			expect(result.left.Offset).toBe(4);
		});
	});

	// ── Auto token handling ─────────────────────────────────────────

	describe("auto token handling", () => {
		it("should fall back to zero padding when 'auto' is used alone", () => {
			const result = parsePadding("auto");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(0);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(0);
			expect(result.bottom.Scale).toBe(0);
			expect(result.bottom.Offset).toBe(0);
			expect(result.left.Scale).toBe(0);
			expect(result.left.Offset).toBe(0);
		});

		it("should fall back to zero padding when 'auto' appears in multi-value shorthand", () => {
			const result = parsePadding("10px auto");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(0);
		});
	});

	// ── Fallback (invalid input) ────────────────────────────────────

	describe("fallback (invalid input)", () => {
		it("should return zero UDim padding for unrecognized string", () => {
			const result = parsePadding("banana");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(0);
			expect(result.right.Scale).toBe(0);
			expect(result.right.Offset).toBe(0);
		});

		it("should return zero UDim padding for too many values", () => {
			const result = parsePadding("1px 2px 3px 4px 5px");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(0);
		});

		it("should return zero UDim padding for empty string", () => {
			const result = parsePadding("");

			expect(result.top.Scale).toBe(0);
			expect(result.top.Offset).toBe(0);
		});
	});
});
