/**
 * InlineText.tsx — Rich text with inline image support for Roblox.
 *
 * Parses `<img src="..." width="N" height="N" />` tags from text strings
 * and renders them as a horizontal row of <Text> and <Image> elements.
 *
 * Roblox's built-in RichText does NOT support inline images, so this component
 * splits the string into text and image segments, rendering each as a separate
 * element inside a flex row container.
 *
 * When no images are found, falls back to a plain <Text> element.
 *
 * Usage:
 *   <InlineText style={{ fontSize: 18, color: "#FFF" }}>
 *     {"Hello <img src=\"rbxassetid://123\" width=\"20\" height=\"20\" /> World!"}
 *   </InlineText>
 */
import React from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
interface InlineTextProps extends React.PropsWithChildren {
    Text?: string;
    style?: CSSProperties;
}
export declare function InlineText(props: InlineTextProps): React.JSX.Element;
export {};
