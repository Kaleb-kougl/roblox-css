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
import { NAMED_COLORS } from "./namedColors";
import { createLogger } from "../logger";

const log = createLogger("colorParser");

/**
 * Branded ParsedColor — the `_parsed` brand ensures only values produced by
 * parseColor() are assignable. A plain `{ color: Color3; transparency: number }`
 * will NOT satisfy this type, catching accidental bypasses at compile time.
 */
export type ParsedColor = {
	readonly color: Color3;
	readonly transparent: boolean;
	readonly transparency: number;
} & { readonly _parsed: unique symbol };

/** Helper to construct a branded ParsedColor inside this module. */
function makeParsedColor(color: Color3, transparency: number): DeepReadonly<ParsedColor> {
	return { color, transparent: transparency === 1, transparency } as unknown as DeepReadonly<ParsedColor>;
}

export function parseColor(_input: string | Color3): DeepReadonly<ParsedColor> {
	// 1. If input is already Color3, return it
	if (typeIs(_input, "Color3")) {
		return makeParsedColor(_input, 0);
	}
	// if not Color3, it must be a string
	const input = _input as string;

	// 2. If string "transparent", return white + transparency: 1
	if (input === "transparent") {
		return makeParsedColor(new Color3(1, 1, 1), 1);
	}

	// 3. If starts with "#" or is a valid hex without "#", parse hex (handle 3-char and 6-char)
	const hasHash = input.sub(1, 1) === "#";
	const possibleHex = hasHash ? input.sub(2) : input;

	if ((possibleHex.size() === 3 || possibleHex.size() === 6) && tonumber(possibleHex, 16) !== undefined) {
		let r = 0,
			g = 0,
			b = 0;

		if (possibleHex.size() === 3) {
			// RGB → double each digit: "f" → "ff"
			r = tonumber(possibleHex.sub(1, 1).rep(2), 16) ?? 0;
			g = tonumber(possibleHex.sub(2, 2).rep(2), 16) ?? 0;
			b = tonumber(possibleHex.sub(3, 3).rep(2), 16) ?? 0;
		} else {
			// RRGGBB
			r = tonumber(possibleHex.sub(1, 2), 16) ?? 0;
			g = tonumber(possibleHex.sub(3, 4), 16) ?? 0;
			b = tonumber(possibleHex.sub(5, 6), 16) ?? 0;
		}

		return makeParsedColor(Color3.fromRGB(r, g, b), 0);
	}

	// 4. If starts with "rgb(" or "rgba(", extract numbers
	if (input.sub(1, 4) === "rgb(") {
		const parts = input.split(",");
		const r = tonumber(parts[0].sub(5)) ?? 0;
		const g = tonumber(parts[1]) ?? 0;
		const b = tonumber(parts[2].sub(1, -2)) ?? 0;
		return makeParsedColor(Color3.fromRGB(r, g, b), 0);
	} else if (input.sub(1, 5) === "rgba(") {
		const parts = input.split(",");
		const r = tonumber(parts[0].sub(6)) ?? 0;
		const g = tonumber(parts[1]) ?? 0;
		const b = tonumber(parts[2]) ?? 0;
		const alpha = tonumber(parts[3].sub(1, -2)) ?? 1;
		return makeParsedColor(Color3.fromRGB(r, g, b), 1 - alpha);
	}

	// 4.5. HSL / HSLA support
	if (input.sub(1, 4) === "hsl(" || input.sub(1, 5) === "hsla(") {
		const isHsla = input.sub(1, 5) === "hsla(";
		const parts = input.split(",");
		// Extract hue from first part: "hsl(120" or "hsla(120"
		const hStr = isHsla ? parts[0].sub(6) : parts[0].sub(5);
		const h = ((tonumber(hStr) ?? 0) % 360 + 360) % 360; // normalize to [0, 360)

		// Extract saturation — strip non-numeric chars (%, spaces) via Lua pattern
		const [sMatch] = string.match(parts[1] ?? "", "([%d%.]+)");
		const s = math.clamp((tonumber(sMatch) ?? 0) / 100, 0, 1);

		// Extract lightness — strip non-numeric chars (%, ), spaces)
		const [lMatch] = string.match(parts[2] ?? "", "([%d%.]+)");
		const l = math.clamp((tonumber(lMatch) ?? 0) / 100, 0, 1);

		// Extract alpha (hsla only) — strip closing paren
		const alpha = isHsla && parts.size() >= 4 ? (tonumber(parts[3].sub(1, -2)) ?? 1) : 1;

		// HSL to RGB conversion (standard algorithm)
		const c = (1 - math.abs(2 * l - 1)) * s;
		const x = c * (1 - math.abs(((h / 60) % 2) - 1));
		const m = l - c / 2;

		let r1 = 0, g1 = 0, b1 = 0;
		if (h < 60) { r1 = c; g1 = x; b1 = 0; }
		else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
		else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
		else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
		else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
		else { r1 = c; g1 = 0; b1 = x; }

		return makeParsedColor(
			new Color3(math.clamp(r1 + m, 0, 1), math.clamp(g1 + m, 0, 1), math.clamp(b1 + m, 0, 1)),
			1 - alpha,
		);
	}

	// 5. Lookup in NAMED_COLORS table (case-insensitive)
	const rgb = NAMED_COLORS.get(input.lower());
	if (rgb) {
		return makeParsedColor(Color3.fromRGB(rgb[0], rgb[1], rgb[2]), 0);
	}

	// 6. Fallback: warn + return white
	log.warn("UNKNOWN_COLOR", "Unknown color string", { input });
	return makeParsedColor(new Color3(1, 1, 1), 0);
}
