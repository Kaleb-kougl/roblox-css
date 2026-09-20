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
import { CSSProperties, WebStyleResult } from "../styles/webStyle";
import { DeepReadonly } from "../types";
export declare function useWebStyle(style: CSSProperties, hostText?: string): DeepReadonly<WebStyleResult>;
export declare function useWebStyle(style: CSSProperties | undefined, hostText?: string): DeepReadonly<WebStyleResult> | undefined;
