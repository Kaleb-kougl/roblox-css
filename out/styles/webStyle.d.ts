/**
 * webStyle.ts — Core CSS → Roblox translation engine.
 *
 * Takes a CSSProperties object and produces:
 *   1. Roblox instance properties (Size, BackgroundColor3, etc.)
 *   2. Child instances to inject (UICorner, UIPadding, UIListLayout, UIStroke)
 *
 * This is the heart of the middleware — the function that makes
 * <Box style={{ borderRadius: 10 }}> automatically inject a <uicorner>.
 *
 * Translation mapping:
 *   CSS Property        → Roblox Output
 *   ─────────────────────────────────────────────────────────
 *   width / height      → Size (UDim2)
 *   backgroundColor     → BackgroundColor3 + BackgroundTransparency
 *   opacity             → BackgroundTransparency (inverted: 1 - opacity)
 *   borderRadius        → <uicorner> child (CornerRadius)
 *   padding / padding*  → <uipadding> child (PaddingTop/Right/Bottom/Left)
 *   display: "flex"     → <uilistlayout> child (FillDirection, alignment, gap)
 *   border              → <uistroke> child (Thickness, Color)
 *   position: "absolute"→ Position (UDim2) + AnchorPoint (Vector2)
 */
import type { CSSProperties } from "./CSSTypes";
import { DeepReadonly } from "../types";
import React from "@rbxts/react";
export type { CSSProperties };
/**
 * Branded WebStyleResult — the `_parsed` brand ensures only values produced by
 * webStyle() are assignable. A plain `{ props, children }` object will NOT
 * satisfy this type, catching accidental bypasses at compile time.
 *
 * - `props`:    Roblox instance properties to spread onto the host element
 * - `children`: UI constraint elements to inject (<uicorner>, <uipadding>, etc.)
 */
export type WebStyleResult = {
    readonly props: Record<string, unknown>;
    readonly children: React.Element[];
} & {
    readonly _parsed: unique symbol;
};
/**
 * Default shadow asset for boxShadow emulation.
 *
 * This is a 9-slice shadow sprite from the Roblox Creator Marketplace:
 *   https://create.roblox.com/store/asset/6015897843
 *
 * SliceCenter is hardcoded to Rect(47, 47, 450, 450) to match this specific
 * asset's padding region. If you change the asset, update SHADOW_SLICE_CENTER
 * accordingly.
 *
 * To use a custom shadow asset project-wide, set `SHADOW_ASSET_ID` and
 * `SHADOW_SLICE_CENTER` before any UI renders.
 */
export declare const SHADOW_ASSET_ID = "rbxassetid://6015897843";
export declare const SHADOW_SLICE_CENTER: Rect;
/**
 * Translates a CSSProperties object into Roblox-compatible props and child elements.
 *
 * This is the primary entry point for the CSS → Roblox translation layer.
 * Wrapper components (Box, Text, etc.) call this function with their `style` prop
 * and spread the resulting `props` onto the host instance while injecting `children`
 * as UI constraint siblings.
 *
 * @param style - A CSSProperties object from the component's style prop.
 * @returns A branded WebStyleResult containing:
 *   - `props`:    Record of Roblox instance properties (Size, BackgroundColor3, Position, etc.)
 *   - `children`: Array of React elements for UI constraints (<uicorner>, <uipadding>, etc.)
 *
 * @example
 *   const result = webStyle({ width: "50%", backgroundColor: "#333", borderRadius: 8 });
 *   // result.props   → { Size: UDim2(...), BackgroundColor3: Color3(...) }
 *   // result.children → [ <uicorner CornerRadius={UDim(0, 8)} /> ]
 */
export declare function webStyle(style: CSSProperties): DeepReadonly<WebStyleResult>;
