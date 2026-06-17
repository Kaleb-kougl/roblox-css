import React, { forwardRef } from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { webStyle } from "../styles/webStyle";
import { MotionProps, useVariantResolver } from "./useVariantResolver";

export type MotionTextProps = React.PropsWithChildren<React.ComponentProps<"textlabel">> & {
	style?: CSSProperties;
} & MotionProps & { readonly _motionTextProps?: unique symbol };

function textParser(style: CSSProperties) {
	const result = webStyle(style).props as Record<string, unknown>;
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
 * MotionText component — Declarative animated equivalent of Text.
 */
export const MotionText = forwardRef<TextLabel, MotionTextProps>((props, ref) => {
	const animate = props.animate;
	const initial = props.initial;
	const variants = props.variants;
	const transition = props.transition;
	const style = props.style;
	const children = props.children;

	const { animatedProps, staticProps } = useVariantResolver(
		animate,
		initial,
		variants,
		transition,
		textParser
	);

	const defaultProps = {
		BackgroundTransparency: 1,
		TextWrapped: true,
		Text: "",
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
	explicitProps._motionTextProps = undefined;

	if (typeIs(children, "string") || typeIs(children, "number")) {
		explicitProps.Text = tostring(children);
	}

	let parsedStyleProps: Record<string, unknown> = {};
	let parsedStyleChildren: React.Element[] = [];

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

	return (
		<textlabel
			ref={ref}
			{...defaultProps}
			{...parsedStyleProps}
			{...explicitProps}
			{...staticProps}
			{...animatedProps}
		>
			{parsedStyleChildren}
			{typeIs(children, "string") || typeIs(children, "number") ? undefined : children}
		</textlabel>
	);
});
