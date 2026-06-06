/**
 * ScrollBox.tsx — A scrollable container component for Roblox.
 *
 * Provides a scrollable <div> equivalent that supports a web-like CSS syntax (`style` prop).
 * It automatically translates CSS properties (e.g., `backgroundColor: "red"`) into
 * Roblox engine equivalents (`BackgroundColor3`) and injects layout constraints
 * like `UICorner`, `UIPadding`, `UIListLayout`, and `UIGridLayout` as child instances.
 *
 * Mirrors the architecture of Box.tsx but renders a native <scrollingframe> instead
 * of a <frame>, with clean defaults for a modern scrolling experience.
 *
 * Usage:
 *   <ScrollBox style={{ width: "100%", height: "300px", display: "flex", gap: "8px" }}>
 *     <textlabel Text="Item 1" />
 *     <textlabel Text="Item 2" />
 *   </ScrollBox>
 */
import React from "@rbxts/react";
import { CSSProperties } from "../styles/webStyle";
export type ScrollBoxProps = React.PropsWithChildren<React.ComponentProps<"scrollingframe">> & {
    style?: CSSProperties;
} & {
    readonly _scrollBoxProps?: unique symbol;
};
export declare const ScrollBox: React.ForwardRefExoticComponent<Omit<ScrollBoxProps, "ref"> & React.RefAttributes<ScrollingFrame>>;
