import { DeepReadonly } from "../types";
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
export type ParsedDimension = UDim & {
    readonly _parsed: unique symbol;
};
export declare function parseDimension(_input: string | number): ParsedDimension | undefined;
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
} & {
    readonly _parsed: unique symbol;
};
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
export declare function parsePadding(_input: string | number): DeepReadonly<PaddingValues>;
