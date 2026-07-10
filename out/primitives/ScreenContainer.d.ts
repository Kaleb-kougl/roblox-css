/**
 * ScreenContainer.tsx — A ScreenGui wrapper for on-screen Roblox UI.
 *
 * Provides the top-level container that should be parented into StarterGui or
 * PlayerGui by the consuming experience. Descendant primitives remain ordinary
 * GuiObjects such as Frame, TextLabel, TextButton, and ScrollingFrame.
 */
import React from "@rbxts/react";
import { DeepReadonly } from "../types";
export type ScreenContainerProps = React.PropsWithChildren<React.ComponentProps<"screengui">> & {
    readonly _screenContainerProps?: unique symbol;
};
export declare function makeScreenContainerProps(props: Omit<ScreenContainerProps, "_screenContainerProps">): DeepReadonly<ScreenContainerProps>;
export declare const ScreenContainer: React.ForwardRefExoticComponent<Omit<ScreenContainerProps, "ref"> & React.RefAttributes<ScreenGui>>;
