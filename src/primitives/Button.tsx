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

import React, { forwardRef } from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { webStyle } from "../styles/webStyle";
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
} & { readonly _buttonProps?: unique symbol };

/** Helper to construct a branded ButtonProps. */
export function makeButtonProps(props: Omit<ButtonProps, "_buttonProps">): DeepReadonly<ButtonProps> {
	return props as unknown as DeepReadonly<ButtonProps>;
}



/**
 * Button component — The primary component for interactive clickable elements.
 *
 * Maps to: HTML <button> → Roblox <textbutton>
 * Renders a native <textbutton>, mapping web styles and React-like event handlers (onClick, etc.).
 */
export const Button = forwardRef<TextButton, ButtonProps>((props, ref) => {
	// 1. Extract custom styling props, children, and event handlers
	const style = props.style;
	const children = props.children;
	const onClick = props.onClick;
	const onMouseEnter = props.onMouseEnter;
	const onMouseLeave = props.onMouseLeave;

	const defaultProps = {
		BackgroundTransparency: 1, // Default transparent background like a web button
		TextWrapped: true, // Default wrap text
		Text: "", // Default empty text instead of 'Button'
		AutoButtonColor: false, // Prevent native roblox hover tinting and text stutter
	} as Record<string, unknown>;

	if (props.Size === undefined && (!style || (style.width === undefined && style.height === undefined))) {
		defaultProps.AutomaticSize = Enum.AutomaticSize.XY;
	}

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.style = undefined;
	explicitProps.children = undefined;
	explicitProps.onClick = undefined;
	explicitProps.onMouseEnter = undefined;
	explicitProps.onMouseLeave = undefined;

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

		// wordBreak — inject zero-width spaces or newlines for character-level wrapping
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

	// 5. Map React-style event props to the Roblox Event table
	const existingEvents = (props.Event as Record<string, unknown>) ?? {};
	const mergedEvents: Record<string, unknown> = { ...existingEvents };
	
	if (onClick !== undefined) mergedEvents.Activated = onClick;
	if (onMouseEnter !== undefined) mergedEvents.MouseEnter = onMouseEnter;
	if (onMouseLeave !== undefined) mergedEvents.MouseLeave = onMouseLeave;
	
	explicitProps.Event = mergedEvents;

	// 6. Render the native textbutton with merged properties and children
	return (
		<textbutton ref={ref} {...defaultProps} {...parsedStyleProps} {...explicitProps}>
			{parsedStyleChildren}
			{typeIs(children, "string") || typeIs(children, "number") ? undefined : children}
		</textbutton>
	);
});
