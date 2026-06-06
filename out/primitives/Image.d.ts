/**
 * Image.tsx — <img> equivalent for Roblox.
 *
 * Renders an <imagelabel> with web-like style props.
 * Accepts `src` (maps to Image property) as rbxassetid:// URI.
 *
 * Maps to: HTML <img> → Roblox <imagelabel>
 */
import React from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { DeepReadonly } from "../types";
/**
 * Branded ImageProps — the `_imageProps` brand ensures strict nominal typing.
 * This prevents accidental bypasses or incorrect prop structures.
 */
export type ImageProps = React.PropsWithChildren<React.ComponentProps<"imagelabel">> & {
    /**
     * Web-like CSS styling object that automatically maps to Roblox properties
     * and injects necessary UI constraints (UICorner, UIPadding, UIListLayout).
     */
    style?: CSSProperties;
    /**
     * The source URI of the image (e.g., rbxassetid://...).
     */
    src?: string;
} & {
    readonly _imageProps?: unique symbol;
};
/** Helper to construct a branded ImageProps. */
export declare function makeImageProps(props: Omit<ImageProps, "_imageProps">): DeepReadonly<ImageProps>;
/**
 * Image component — The primary component for rendering images.
 *
 * Maps to: HTML <img> → Roblox <imagelabel>
 * Renders a native <imagelabel> while mapping web styles and translating `src` to the `Image` property.
 */
export declare const Image: React.ForwardRefExoticComponent<Omit<ImageProps, "ref"> & React.RefAttributes<ImageLabel>>;
