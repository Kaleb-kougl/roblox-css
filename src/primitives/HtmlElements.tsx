import React, { forwardRef } from "@rbxts/react";
import { Box, BoxProps } from "./Box";
import { Text, TextProps } from "./Text";
import { InlineText } from "./InlineText";
import { CSSProperties } from "../styles/CSSTypes";

export const Div = Box;
export const Span = InlineText;

export const P = forwardRef<TextLabel, TextProps>((props, ref) => {
	const defaultStyle: CSSProperties = { fontSize: 16 };
	const mergedStyle = props.style ? { ...defaultStyle, ...props.style } : defaultStyle;
	return <Text ref={ref} {...props} style={mergedStyle} />;
});

export const H1 = forwardRef<TextLabel, TextProps>((props, ref) => {
	const defaultStyle: CSSProperties = { fontSize: 32, fontWeight: "bold" };
	const mergedStyle = props.style ? { ...defaultStyle, ...props.style } : defaultStyle;
	return <Text ref={ref} {...props} style={mergedStyle} />;
});

export const H2 = forwardRef<TextLabel, TextProps>((props, ref) => {
	const defaultStyle: CSSProperties = { fontSize: 24, fontWeight: "bold" };
	const mergedStyle = props.style ? { ...defaultStyle, ...props.style } : defaultStyle;
	return <Text ref={ref} {...props} style={mergedStyle} />;
});

export const H3 = forwardRef<TextLabel, TextProps>((props, ref) => {
	const defaultStyle: CSSProperties = { fontSize: 18, fontWeight: "bold" };
	const mergedStyle = props.style ? { ...defaultStyle, ...props.style } : defaultStyle;
	return <Text ref={ref} {...props} style={mergedStyle} />;
});
