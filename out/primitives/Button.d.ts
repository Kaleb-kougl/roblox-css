/**
 * Button.tsx — <button> equivalent for Roblox.
 *
 * Renders a <textbutton> with web-like style props.
 * Delegates CSS→Roblox translation to webStyle(), and adds text-content
 * manipulation features (textTransform, textDecoration, wordBreak) that
 * require mutating the Text string before rendering.
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
 * Event mapping:
 *   React Prop          → Roblox Output
 *   ─────────────────────────────────────────────────────────
 *   onClick             → Event.Activated
 *   onMouseEnter        → Event.MouseEnter
 *   onMouseLeave        → Event.MouseLeave
 *
 * Maps to: HTML <button> → Roblox <textbutton>
 *
 * Usage:
 *   <Button
 *     style={{ backgroundColor: "#007BFF", padding: "10px 20px", color: "white", borderRadius: "4px" }}
 *     onClick={() => print("Clicked!")}
 *   >
 *     Submit
 *   </Button>
 */
import React from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { DeepReadonly } from "../types";
/**
 * Branded ButtonProps — the `_buttonProps` brand ensures strict nominal typing.
 * This prevents accidental bypasses or incorrect prop structures.
 */
export type ButtonProps = React.PropsWithChildren<React.ComponentProps<"textbutton">> & {
    /**
     * Web-like CSS styling object that automatically maps to Roblox properties
     * and injects necessary UI constraints (UICorner, UIPadding, UIListLayout).
     */
    style?: CSSProperties;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
} & {
    readonly _buttonProps?: unique symbol;
};
/** Helper to construct a branded ButtonProps. */
export declare function makeButtonProps(props: Omit<ButtonProps, "_buttonProps">): DeepReadonly<ButtonProps>;
/**
 * Button component — The primary component for interactive clickable elements.
 *
 * Maps to: HTML <button> → Roblox <textbutton>
 * Renders a native <textbutton>, mapping web styles and React-like event handlers (onClick, etc.).
 */
export declare const Button: React.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & React.RefAttributes<TextButton>>;
