/**
 * Image.tsx — <img> equivalent for Roblox.
 *
 * Renders an <imagelabel> with web-like style props.
 * Accepts `src` (maps to Image property) as rbxassetid:// URI.
 *
 * Maps to: HTML <img> → Roblox <imagelabel>
 */

import React, { forwardRef } from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { useWebStyle } from "./useWebStyle";
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
} & { readonly _imageProps?: unique symbol };

/** Helper to construct a branded ImageProps. */
export function makeImageProps(props: Omit<ImageProps, "_imageProps">): DeepReadonly<ImageProps> {
	return props as unknown as DeepReadonly<ImageProps>;
}

/**
 * Image component — The primary component for rendering images.
 *
 * Maps to: HTML <img> → Roblox <imagelabel>
 * Renders a native <imagelabel> while mapping web styles and translating `src` to the `Image` property.
 */
export const Image = forwardRef<ImageLabel, ImageProps>((props, ref) => {
	// 1. Extract custom styling props, src, and children
	const style = props.style;
	const src = props.src;
	const children = props.children;

	const defaultProps = {
		BackgroundTransparency: 1, // Default transparent background
	} as Record<string, unknown>;

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.style = undefined;
	explicitProps.src = undefined;
	explicitProps.children = undefined;

	// 3. Map src prop to the Image property
	if (src !== undefined) {
		explicitProps.Image = src;
	}

	let parsedStyleProps: Record<string, unknown> = {};
	let parsedStyleChildren: React.Element[] = [];

	// Cached across renders while the style values are unchanged — see useWebStyle.
	const parsed = useWebStyle(style);

	// 4. If a style object is provided, compile it
	if (style !== undefined && parsed !== undefined) {
		parsedStyleProps = parsed.props as Record<string, unknown>;
		parsedStyleChildren = parsed.children as React.Element[];

		if (style.opacity !== undefined) {
			// Copy before writing: the parse result is shared across renders, so
			// mutating it in place would re-apply the opacity multiplication on
			// every render and fade the image progressively.
			const currentImageTrans = (parsedStyleProps.ImageTransparency as number | undefined) ?? 0;
			parsedStyleProps = { ...parsedStyleProps };
			parsedStyleProps.ImageTransparency = 1 - ((1 - currentImageTrans) * style.opacity);
		}
	}

	// 5. Render the native imagelabel with merged properties and children
	return (
		<imagelabel ref={ref} {...defaultProps} {...parsedStyleProps} {...explicitProps}>
			{parsedStyleChildren}
			{children}
		</imagelabel>
	);
});
