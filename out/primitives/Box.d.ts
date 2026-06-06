/**
 * Box.tsx — The foundational UI container component for Roblox.
 *
 * Provides a <div> equivalent that supports a web-like CSS syntax (`style` prop).
 * It automatically translates CSS properties (e.g., `backgroundColor: "red"`) into
 * Roblox engine equivalents (`BackgroundColor3`) and injects layout constraints
 * like `UICorner`, `UIPadding`, `UIListLayout`, and `UIGridLayout` as child instances.
 *
 * Usage:
 *   <Box style={{ width: "100%", height: "50px", backgroundColor: "#333", borderRadius: "8px" }}>
 *     <textlabel Text="Hello World" />
 *   </Box>
 */
import React from "@rbxts/react";
import { CSSProperties } from "../styles/webStyle";
import { DeepReadonly } from "../types";
export type BoxProps = React.PropsWithChildren<React.ComponentProps<"frame">> & {
    style?: CSSProperties;
} & {
    readonly _boxProps?: unique symbol;
};
export declare function makeBoxProps(props: Omit<BoxProps, "_boxProps">): DeepReadonly<BoxProps>;
export declare const Box: React.ForwardRefExoticComponent<Omit<BoxProps, "ref"> & React.RefAttributes<Frame>>;
