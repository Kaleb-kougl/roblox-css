import React, { forwardRef } from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { webStyle } from "../styles/webStyle";
import { MotionProps, useVariantResolver } from "./useVariantResolver";

export type MotionImageProps = React.PropsWithChildren<React.ComponentProps<"imagelabel">> & {
	style?: CSSProperties;
	src?: string;
} & MotionProps & { readonly _motionImageProps?: unique symbol };

/**
 * MotionImage component — Declarative animated equivalent of Image.
 */
export const MotionImage = forwardRef<ImageLabel, MotionImageProps>((props, ref) => {
	const animate = props.animate;
	const initial = props.initial;
	const variants = props.variants;
	const transition = props.transition;
	const style = props.style;
	const src = props.src;
	const children = props.children;

	const { animatedProps, staticProps } = useVariantResolver(
		animate,
		initial,
		variants,
		transition
	);

	const defaultProps = {
		BackgroundTransparency: 1,
	} as Record<string, unknown>;

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.animate = undefined;
	explicitProps.initial = undefined;
	explicitProps.variants = undefined;
	explicitProps.transition = undefined;
	explicitProps.style = undefined;
	explicitProps.src = undefined;
	explicitProps.children = undefined;
	explicitProps._motionImageProps = undefined;

	if (src !== undefined) {
		explicitProps.Image = src;
	}

	let parsedStyleProps: Record<string, unknown> = {};
	let parsedStyleChildren: React.Element[] = [];

	if (style) {
		const parsed = webStyle(style);
		parsedStyleProps = parsed.props as Record<string, unknown>;
		parsedStyleChildren = parsed.children as React.Element[];
	}

	return (
		<imagelabel
			ref={ref}
			{...defaultProps}
			{...parsedStyleProps}
			{...explicitProps}
			{...staticProps}
			{...animatedProps}
		>
			{parsedStyleChildren}
			{children}
		</imagelabel>
	);
});
