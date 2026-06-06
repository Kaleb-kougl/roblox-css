/**
 * colorParser.ts — Converts CSS color strings to Roblox Color3.
 *
 * Supported formats:
 *   - Hex:   "#ff0000", "#f00"
 *   - RGB:   "rgb(255, 0, 0)"
 *   - RGBA:  "rgba(255, 0, 0, 0.5)"
 *   - HSL:   "hsl(0, 100%, 50%)"
 *   - HSLA:  "hsla(0, 100%, 50%, 0.5)"
 *   - Named: "red", "blue", "white", "transparent"
 *   - Pass-through: Color3 instances returned as-is
 *
 * Returns a ParsedColor with `transparent` flag for "transparent" keyword.
 */
import { DeepReadonly } from "../types";
/**
 * Branded ParsedColor — the `_parsed` brand ensures only values produced by
 * parseColor() are assignable. A plain `{ color: Color3; transparency: number }`
 * will NOT satisfy this type, catching accidental bypasses at compile time.
 */
export type ParsedColor = {
    readonly color: Color3;
    readonly transparent: boolean;
    readonly transparency: number;
} & {
    readonly _parsed: unique symbol;
};
export declare function parseColor(_input: string | Color3): DeepReadonly<ParsedColor>;
