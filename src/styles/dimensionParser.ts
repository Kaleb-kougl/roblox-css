import { DeepReadonly } from "../types";
import { createLogger } from "../logger";

const log = createLogger("dimensionParser");

/**
 * dimensionParser.ts — Converts CSS dimension strings to Roblox UDim.
 *
 * Supported formats:
 *   - Pixels:   "100px" or 100 (number) → UDim(0, 100)
 *   - Percent:  "50%"                   → UDim(0.5, 0)
 *   - Viewport: "100vw" / "100vh"       → UDim(1, 0)
 *   - Calc:     "calc(100% - 10px)"     → UDim(1.0, -10)
 *   - Auto:     "auto"                  → undefined
 *
 * Also exports parsePadding() for CSS padding shorthand.
 *
 */

/**
 * Branded ParsedDimension — the `_parsed` brand ensures only values produced by
 * parseDimension() are assignable. A raw UDim will NOT satisfy this type,
 * catching accidental bypasses at compile time.
 */
export type ParsedDimension = UDim & { readonly _parsed: unique symbol };

/** Helper to construct a branded ParsedDimension inside this module. */
function makeParsedDimension(scale: number, offset: number): ParsedDimension {
	return new UDim(scale, offset) as unknown as ParsedDimension;
}

function parseCalc(inner: string): ParsedDimension | undefined {
	let parts = inner.split(" - ");
	let isSubtraction = true;

	if (parts.size() !== 2) {
		parts = inner.split(" + ");
		isSubtraction = false;
	}

	if (parts.size() !== 2) {
		log.warn("PARSE_CALC_FAILED", "Malformed calc expression", { inner });
		return undefined;
	}

	const term1 = parseDimension(parts[0]);
	const term2 = parseDimension(parts[1]);

	if (term1 === undefined || term2 === undefined) {
		log.warn("PARSE_CALC_FAILED", "Failed to parse calc terms", { inner });
		return undefined;
	}

	let scale2 = term2.Scale;
	let offset2 = term2.Offset;

	if (isSubtraction) {
		scale2 = -scale2;
		offset2 = -offset2;
	}

	return makeParsedDimension(term1.Scale + scale2, term1.Offset + offset2);
}

export function parseDimension(_input: string | number): ParsedDimension | undefined {
	// 1. If number, treat as pixels → UDim(0, input)
	if (typeIs(_input, "number")) {
		return makeParsedDimension(0, _input);
	}
	// 1.5. If calc(...) expression, delegate to parseCalc
	if (typeIs(_input, "string") && _input.sub(1, 5) === "calc(") {
		const inner = _input.sub(6, -2); // strip "calc(" prefix and ")" suffix
		const result = parseCalc(inner);
		if (result !== undefined) {
			return result;
		}
		// Malformed calc — fall through to the warn at the bottom
	}
	// 2. If string ending in "px", extract number → UDim(0, n)
	if (_input.sub(-2) === "px") {
		const n = tonumber(_input.sub(1, -3));
		if (n !== undefined) {
			return makeParsedDimension(0, n);
		}
	}
	// 3. If string ending in "%", extract number / 100 → UDim(n/100, 0)
	if (_input.sub(-1) === "%") {
		const n = tonumber(_input.sub(1, -2));
		if (n !== undefined) {
			return makeParsedDimension(n / 100, 0);
		}
	}
	// 4. If "100vw" or "100vh", → UDim(1, 0)
	const last2Chars = _input.sub(-2);
	if (last2Chars === "vh" || last2Chars === "vw") {
		const n = tonumber(_input.sub(1, -3));
		if (n !== undefined) {
			return makeParsedDimension(n / 100, 0);
		}
	}

	// 5. If "auto" → undefined
	if (_input === "auto") {
		return undefined;
	}

	// 6. If raw number string (e.g. "0")
	if (typeIs(_input, "string")) {
		const rawNumber = tonumber(_input);
		if (rawNumber !== undefined) {
			return makeParsedDimension(0, rawNumber);
		}
	}

	//  Fallback: warn + return undefined (callers must handle this)
	log.warn("PARSE_DIMENSION_FAILED", "Could not parse dimension", { input: _input });
	return undefined;
}

/**
 * Branded PaddingValues — the `_parsed` brand ensures only values produced by
 * parsePadding() are assignable. A plain object with top, right, bottom, left
 * will NOT satisfy this type, catching accidental bypasses at compile time.
 */
export type PaddingValues = {
	readonly top: UDim;
	readonly right: UDim;
	readonly bottom: UDim;
	readonly left: UDim;
} & { readonly _parsed: unique symbol };

/** Helper to construct a branded PaddingValues inside this module. */
function makePaddingValues(top: UDim, right: UDim, bottom: UDim, left: UDim): DeepReadonly<PaddingValues> {
	return { top, right, bottom, left } as unknown as DeepReadonly<PaddingValues>;
}

const ZERO_UDIM = new UDim(0, 0);

/**
 * Converts a CSS padding shorthand string or number into UDim values for all 4 sides.
 *
 * Supported formats (similar to CSS):
 *   - 1 value:  "10px"            → top/right/bottom/left
 *   - 2 values: "10px 20%"        → top/bottom, right/left
 *   - 3 values: "10px 20% 10px"   → top, right/left, bottom
 *   - 4 values: "10px 20% 10px 5%" → top, right, bottom, left
 *
 * Supports any dimension format supported by parseDimension (px, %, vw, vh).
 * Number inputs are treated as pixels applied to all sides.
 */
export function parsePadding(_input: string | number): DeepReadonly<PaddingValues> {
	// 1. If number, treat as pixels on all sides
	if (typeIs(_input, "number")) {
		const dim = parseDimension(_input)!;
		return makePaddingValues(dim, dim, dim, dim);
	}
	// 2. If string, split on whitespace and parse each token through parseDimension
	const splitInput = _input.split(" ");
	const size = splitInput.size();

	if (size === 1) {
		//    - 1 value:  all sides
		const a = parseDimension(splitInput[0]);
		if (a !== undefined) {
			return makePaddingValues(a, a, a, a);
		}
	}
	if (size === 2) {
		//    - 2 values: vertical | horizontal
		const a = parseDimension(splitInput[0]);
		const b = parseDimension(splitInput[1]);
		if (a !== undefined && b !== undefined) {
			return makePaddingValues(a, b, a, b);
		}
	}
	//    - 3 values: top | horizontal | bottom
	if (size === 3) {
		const a = parseDimension(splitInput[0]);
		const b = parseDimension(splitInput[1]);
		const c = parseDimension(splitInput[2]);
		if (a !== undefined && b !== undefined && c !== undefined) {
			return makePaddingValues(a, b, c, b);
		}
	}
	//    - 4 values: top | right | bottom | left
	if (size === 4) {
		const a = parseDimension(splitInput[0]);
		const b = parseDimension(splitInput[1]);
		const c = parseDimension(splitInput[2]);
		const d = parseDimension(splitInput[3]);
		if (a !== undefined && b !== undefined && c !== undefined && d !== undefined) {
			return makePaddingValues(a, b, c, d);
		}
	}
	// Fallback warn + return zero UDim padding
	log.warn("PARSE_PADDING_FAILED", "Could not parse padding values", { input: _input });
	return makePaddingValues(ZERO_UDIM, ZERO_UDIM, ZERO_UDIM, ZERO_UDIM);
}
