import React, { forwardRef } from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { webStyle } from "../styles/webStyle";
import { MotionProps, useVariantResolver } from "./useVariantResolver";

export type MotionButtonProps = React.PropsWithChildren<React.ComponentProps<"textbutton">> & {
	style?: CSSProperties;
	onClick?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
} & MotionProps & { readonly _motionButtonProps?: unique symbol };


function buttonParser(style: CSSProperties) {
	// Delegate entirely to webStyle() which already handles all typography
	// properties (fontSize, textAlign, whiteSpace, color, fontFamily, fontWeight).
	// Previously this duplicated that logic with a different default font (SourceSansPro
	// vs BuilderSans), causing an inconsistency.
	const parsed = webStyle(style);
	const result = parsed.props as Record<string, unknown>;
	// Pass through Roblox-native properties (uppercase keys like Position, TextTransparency)
	// that webStyle doesn't handle, matching the default parser behavior.
	for (const [k, v] of pairs(style as unknown as Map<string, unknown>)) {
		if (typeIs(k, "string") && k !== "_parsed" && result[k] === undefined) {
			const firstChar = k.sub(1, 1);
			if (firstChar >= "A" && firstChar <= "Z") {
				result[k] = v;
			}
		}
	}
	return result;
}

/**
 * MotionButton component — Declarative animated equivalent of Button.
 */
export const MotionButton = forwardRef<TextButton, MotionButtonProps>((props, ref) => {
	const animate = props.animate;
	const initial = props.initial;
	const variants = props.variants;
	const transition = props.transition;
	const style = props.style;
	const children = props.children;
	const onClick = props.onClick;
	const onMouseEnter = props.onMouseEnter;
	const onMouseLeave = props.onMouseLeave;

	const { animatedProps, staticProps } = useVariantResolver(
		animate,
		initial,
		variants,
		transition,
		buttonParser
	);

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
	explicitProps.animate = undefined;
	explicitProps.initial = undefined;
	explicitProps.variants = undefined;
	explicitProps.transition = undefined;
	explicitProps.style = undefined;
	explicitProps.children = undefined;
	explicitProps.onClick = undefined;
	explicitProps.onMouseEnter = undefined;
	explicitProps.onMouseLeave = undefined;
	explicitProps._motionButtonProps = undefined;

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
		<textbutton
			ref={ref}
			{...defaultProps}
			{...parsedStyleProps}
			{...explicitProps}
			{...staticProps}
			{...animatedProps}
		>
			{parsedStyleChildren}
			{typeIs(children, "string") || typeIs(children, "number") ? undefined : children}
		</textbutton>
	);
});
