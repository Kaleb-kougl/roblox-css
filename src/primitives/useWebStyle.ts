/**
 * useWebStyle.ts — Render-stable wrapper around webStyle().
 *
 * webStyle() walks the entire CSSProperties table and allocates fresh prop
 * tables plus constraint elements (<uicorner>, <uipadding>, <uilistlayout>…)
 * on every call. Calling it directly in a component body pays that cost on
 * every render, not just on mount.
 *
 * This hook caches the last parse and reuses it while the style is unchanged.
 *
 * The cache key is a shallow VALUE comparison, not table identity, because the
 * common usage passes a fresh table every render:
 *
 *   <Text style={{ color: "white", fontSize: "18px" }} />
 *
 * Under an identity check (`useMemo(..., [style])`) that call site would miss
 * on every render and the hook would buy nothing. CSSProperties is flat —
 * every value is a string, number or boolean — so comparing own keys is an
 * exact equality check, not an approximation.
 *
 * The cached style is stored as a copy so that a caller mutating its own style
 * table in place cannot produce a false cache hit.
 */

import { useRef } from "@rbxts/react";
import { CSSProperties, webStyle, WebStyleResult } from "../styles/webStyle";
import { DeepReadonly } from "../types";

type WebStyleCache = {
	readonly style: Record<string, unknown>;
	readonly hostText: string | undefined;
	readonly result: DeepReadonly<WebStyleResult>;
};

/** Exact equality for flat CSSProperties tables: same own keys, same values. */
function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
	for (const [key, value] of pairs(a)) {
		if (b[key as string] !== value) return false;
	}
	// Catch keys present in `b` but absent from `a` (nil values are not
	// enumerated by pairs, so a key-count check alone would be unsound).
	for (const [key] of pairs(b)) {
		if (a[key as string] === undefined) return false;
	}
	return true;
}

function copyStyle(style: Record<string, unknown>): Record<string, unknown> {
	const copy: Record<string, unknown> = {};
	for (const [key, value] of pairs(style)) {
		copy[key as string] = value;
	}
	return copy;
}

export function useWebStyle(style: CSSProperties, hostText?: string): DeepReadonly<WebStyleResult>;
export function useWebStyle(
	style: CSSProperties | undefined,
	hostText?: string,
): DeepReadonly<WebStyleResult> | undefined;
export function useWebStyle(
	style: CSSProperties | undefined,
	hostText?: string,
): DeepReadonly<WebStyleResult> | undefined {
	// Called unconditionally — the early return below happens after the hook.
	const cache = useRef<WebStyleCache>();

	if (style === undefined) return undefined;

	const nextStyle = style as unknown as Record<string, unknown>;
	const prev = cache.current;
	if (prev !== undefined && prev.hostText === hostText && shallowEqual(prev.style, nextStyle)) {
		return prev.result;
	}

	const result = webStyle(style, hostText);
	cache.current = { style: copyStyle(nextStyle), hostText, result };
	return result;
}
