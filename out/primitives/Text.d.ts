/**
 * Text.tsx — <span>/<p>/<h1> equivalent for Roblox.
 *
 * Renders a <textlabel> with web-like style props.
 * Extends the core webStyle translation by adding typography-specific mappings.
 * Automatically maps primitive string/number children to the Text property,
 * while still supporting regular React children for nested elements.
 *
 * Typography mapping:
 *   CSS Property        → Roblox Output
 *   ─────────────────────────────────────────────────────────
 *   fontSize            → TextSize (number)
 *   fontFamily          → FontFace (Font object, defaults to BuilderSans)
 *   fontWeight          → FontFace weight (normal/bold/black → Regular/Bold/Heavy)
 *   textAlign           → TextXAlignment (left/center/right)
 *   whiteSpace          → TextWrapped (nowrap → false, otherwise true)
 *   color               → TextColor3 (Color3) + TextTransparency
 *
 * Maps to: HTML <span>/<p> → Roblox <textlabel>
 *
 * Usage:
 *   <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FFFFFF" }}>
 *     Hello Roblox!
 *   </Text>
 */
import React from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { DeepReadonly } from "../types";
/**
 * Branded TextProps — the `_textProps` brand ensures strict nominal typing.
 * This prevents accidental bypasses or incorrect prop structures.
 */
export type TextProps = React.PropsWithChildren<React.ComponentProps<"textlabel">> & {
    /**
     * Web-like CSS styling object that automatically maps to Roblox properties
     * and injects necessary UI constraints (UICorner, UIPadding, UIListLayout).
     */
    style?: CSSProperties;
} & {
    readonly _textProps?: unique symbol;
};
/** Helper to construct a branded TextProps. */
export declare function makeTextProps(props: Omit<TextProps, "_textProps">): DeepReadonly<TextProps>;
/**
 * Text component — The primary component for rendering typography.
 *
 * Maps to: HTML <span>/<p>/<h1> → Roblox <textlabel>
 * Renders a native <textlabel> while mapping web typography styles to Roblox Font properties.
 */
export declare const Text: React.ForwardRefExoticComponent<Omit<TextProps, "ref"> & React.RefAttributes<TextLabel>>;
