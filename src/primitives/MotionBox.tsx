import React, { forwardRef } from "@rbxts/react";
import { CSSProperties, webStyle } from "../styles/webStyle";
import { MotionProps, useVariantResolver } from "./useVariantResolver";

export type MotionBoxProps = React.PropsWithChildren<React.ComponentProps<"frame">> & {
	style?: CSSProperties;
} & MotionProps & { readonly _motionBoxProps?: unique symbol };

/**
 * MotionBox component — Declarative animated equivalent of Box.
 *
 * Exposes Framer Motion-like props (`animate`, `variants`, `transition`) 
 * over the base `webStyle` layout engine.
 */
export const MotionBox = forwardRef<Frame, MotionBoxProps>((props, ref) => {
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
		transition
	);

	const defaultProps = {
		BackgroundTransparency: 1,
		BorderSizePixel: 0,
	} as Record<string, unknown>;

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.animate = undefined;
	explicitProps.initial = undefined;
	explicitProps.variants = undefined;
	explicitProps.transition = undefined;
	explicitProps.style = undefined;
	explicitProps.children = undefined;
	explicitProps._motionBoxProps = undefined;

	let parsedStyleProps: Record<string, unknown> = {};
	let parsedStyleChildren: React.Element[] = [];

	if (style) {
		const parsed = webStyle(style);
		parsedStyleProps = parsed.props as Record<string, unknown>;
		parsedStyleChildren = parsed.children as React.Element[];
	}

	return (
		<frame
			ref={ref}
			{...defaultProps}
			{...parsedStyleProps}
			{...explicitProps}
			{...staticProps}
			{...animatedProps}
		>
			{parsedStyleChildren}
			{children}
		</frame>
	);
});
