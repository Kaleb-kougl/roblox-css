/**
 * Input.tsx — <input> equivalent for Roblox.
 *
 * Renders a <textbox> with web-like style props.
 * Extends the core webStyle translation by adding input-specific mappings.
 * Automatically maps web-like placeholder and onChange props to their
 * Roblox equivalents for a more familiar developer experience.
 *
 * Input mappings:
 *   Web Property        → Roblox Output
 *   ─────────────────────────────────────────────────────────
 *   placeholder         → PlaceholderText (string)
 *   onChange(text)      → Change.Text (event listener)
 *   style               → (Maps via webStyle)
 *
 * Maps to: HTML <input> → Roblox <textbox>
 *
 * Usage:
 *   <Input
 *     placeholder="Enter your name..."
 *     onChange={(text) => print("User typed:", text)}
 *     style={{ width: 200, height: 40, backgroundColor: "#FFFFFF" }}
 *   />
 */
import React from "@rbxts/react";
import { CSSProperties } from "../styles/webStyle";
import { DeepReadonly } from "../types";
/**
 * Branded InputProps — the `_inputProps` brand ensures strict nominal typing.
 * This prevents accidental bypasses or incorrect prop structures.
 */
export type InputProps = React.PropsWithChildren<React.ComponentProps<"textbox">> & {
    /**
     * Web-like CSS styling object that automatically maps to Roblox properties
     * and injects necessary UI constraints (UICorner, UIPadding, UIListLayout).
     */
    style?: CSSProperties;
    /**
     * Web-like alias for PlaceholderText.
     * Sets the text that appears when the input is empty.
     */
    placeholder?: string;
    /**
     * Fired when the text changes.
     * Automatically maps to Roblox's `Change.Text` event.
     */
    onChange?: (text: string) => void;
} & {
    readonly _inputProps?: unique symbol;
};
/** Helper to construct a branded InputProps. */
export declare function makeInputProps(props: Omit<InputProps, "_inputProps">): DeepReadonly<InputProps>;
/**
 * Input component — The primary component for receiving user text input.
 *
 * Maps to: HTML <input> → Roblox <textbox>
 * Renders a native <textbox> while mapping web input props to Roblox properties.
 */
export declare const Input: React.ForwardRefExoticComponent<Omit<InputProps, "ref"> & React.RefAttributes<TextBox>>;
