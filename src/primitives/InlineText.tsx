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
import { Box } from "./Box";
import { Text } from "./Text";
import { Image } from "./Image";
import { parseInlineImages, containsRichTextTags } from "../utils/parseInlineImages";

interface InlineTextProps {
	Text?: string;
	style?: CSSProperties;
}

export function InlineText(props: InlineTextProps) {
	const text = props.Text ?? "";
	const style = props.style;
	const segments = parseInlineImages(text);

	// Check if any segment is an image
	let hasImages = false;
	for (const seg of segments) {
		if (seg.type === "image") {
			hasImages = true;
			break;
		}
	}

	// --- Fallback: no images, render a plain <Text> ---
	if (!hasImages) {
		const textStyle = style ? { ...style } : ({} as CSSProperties);

		// Auto-enable richText if the text contains RichText tags and it's not already
		// being set by textDecoration (which sets RichText=true via webStyle)
		if (
			textStyle.richText === undefined &&
			textStyle.textDecoration === undefined &&
			containsRichTextTags(text)
		) {
			textStyle.richText = true;
		}

		return <Text style={textStyle} Text={text} />;
	}

	// --- Images found: render a flex row with Text and Image segments ---
	const containerStyle: CSSProperties = {
		display: "flex" as const,
		flexDirection: "row" as const,
		alignItems: "center" as const,
		// Merge any container-level styles from the user
		...(style ?? {}),
	};

	return (
		<Box style={containerStyle}>
			{segments.map((segment, i) => {
				if (segment.type === "text") {
					// Build a text-specific style that inherits typography from parent style
					const segmentStyle: CSSProperties = {};
					if (style?.fontSize !== undefined) segmentStyle.fontSize = style.fontSize;
					if (style?.fontFamily !== undefined) segmentStyle.fontFamily = style.fontFamily;
					if (style?.fontWeight !== undefined) segmentStyle.fontWeight = style.fontWeight;
					if (style?.fontStyle !== undefined) segmentStyle.fontStyle = style.fontStyle;
					if (style?.color !== undefined) segmentStyle.color = style.color;
					if (style?.lineHeight !== undefined) segmentStyle.lineHeight = style.lineHeight;
					if (style?.whiteSpace !== undefined) segmentStyle.whiteSpace = style.whiteSpace;
					if (style?.textAlign !== undefined) segmentStyle.textAlign = style.textAlign;
					if (style?.textVerticalAlign !== undefined)
						segmentStyle.textVerticalAlign = style.textVerticalAlign;

					// Always enable richText for text segments so <b>, <font> etc work
					segmentStyle.richText = true;

					// Apply textTransform and textDecoration from parent style
					if (style?.textTransform !== undefined)
						segmentStyle.textTransform = style.textTransform;
					if (style?.textDecoration !== undefined)
						segmentStyle.textDecoration = style.textDecoration;

					return <Text key={`text-${i}`} style={segmentStyle} Text={segment.content} />;
				}

				// Image segment
				return (
					<Image
						key={`img-${i}`}
						src={segment.src}
						style={{
							width: segment.width,
							height: segment.height,
						}}
					/>
				);
			})}
		</Box>
	);
}
