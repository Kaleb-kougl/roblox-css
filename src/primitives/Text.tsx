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

import React, { forwardRef } from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { webStyle } from "../styles/webStyle";
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
} & { readonly _textProps?: unique symbol };

/** Helper to construct a branded TextProps. */
export function makeTextProps(props: Omit<TextProps, "_textProps">): DeepReadonly<TextProps> {
	return props as unknown as DeepReadonly<TextProps>;
}

/**
 * Text component — The primary component for rendering typography.
 *
 * Maps to: HTML <span>/<p>/<h1> → Roblox <textlabel>
 * Renders a native <textlabel> while mapping web typography styles to Roblox Font properties.
 */
export const Text = forwardRef<TextLabel, TextProps>((props, ref) => {
	// 1. Extract custom styling props and children
	const style = props.style;
	const children = props.children;

	const defaultProps = {
		BackgroundTransparency: 1, // Default transparent background like a <span>
		TextWrapped: true, // Default wrap text
		Text: "", // Default empty text instead of 'Label'
	} as Record<string, unknown>;

	if (props.Size === undefined && (!style || (style.width === undefined && style.height === undefined))) {
		defaultProps.AutomaticSize = Enum.AutomaticSize.XY;
	}

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.style = undefined;
	explicitProps.children = undefined;

	// 3. Map primitive children directly to the Text property
	if (typeIs(children, "string") || typeIs(children, "number")) {
		explicitProps.Text = tostring(children);
	}

	let parsedStyleProps: Record<string, unknown> = {};
	let parsedStyleChildren: React.Element[] = [];

	// 4. If a style object is provided, compile it and extract typography mappings
	if (style) {
		const parsed = webStyle(style);
		parsedStyleProps = parsed.props as Record<string, unknown>;
		parsedStyleChildren = parsed.children as React.Element[];

		// Specialized string manipulation for wordBreak
		if (style.wordBreak !== undefined) {
			if (style.wordBreak === "break-all") {
				if (typeIs(explicitProps.Text, "string")) {
					explicitProps.Text = explicitProps.Text.split("").join("\u{200B}");
				}
			} else if (style.wordBreak === "keep-all") {
				if (typeIs(explicitProps.Text, "string")) {
					explicitProps.Text = explicitProps.Text.split(" ").join("\n");
				}
			}
		}

		// textTransform — mutate text content
		if (style.textTransform !== undefined && style.textTransform !== "none") {
			if (typeIs(explicitProps.Text, "string")) {
				if (style.textTransform === "uppercase") {
					explicitProps.Text = (explicitProps.Text as string).upper();
				} else if (style.textTransform === "lowercase") {
					explicitProps.Text = (explicitProps.Text as string).lower();
				} else if (style.textTransform === "capitalize") {
					explicitProps.Text = (explicitProps.Text as string).gsub("%w+", (word) => {
						return word.sub(1, 1).upper() + word.sub(2);
					})[0];
				}
			}
		}

		// textDecoration — wrap text in rich text tags (RichText=true is set by webStyle)
		if (style.textDecoration !== undefined && style.textDecoration !== "none") {
			if (typeIs(explicitProps.Text, "string")) {
				if (style.textDecoration === "underline") {
					explicitProps.Text = `<u>${explicitProps.Text}</u>`;
				} else if (style.textDecoration === "line-through") {
					explicitProps.Text = `<s>${explicitProps.Text}</s>`;
				}
			}
		}
	}

	// 5. Render the native textlabel with merged properties and children
	return (
		<textlabel ref={ref} {...defaultProps} {...parsedStyleProps} {...explicitProps}>
			{parsedStyleChildren}
			{typeIs(children, "string") || typeIs(children, "number") ? undefined : children}
		</textlabel>
	);
});
