import React, { forwardRef } from "@rbxts/react";
import { MotionProps, useVariantResolver } from "./useVariantResolver";

export type MotionUIScaleProps = React.ComponentProps<"uiscale"> & MotionProps & { readonly _motionUIScaleProps?: unique symbol };

/**
 * MotionUIScale component — Declarative animated equivalent of UIScale.
 */
export const MotionUIScale = forwardRef<UIScale, MotionUIScaleProps>((props, ref) => {
	const animate = props.animate;
	const initial = props.initial;
	const variants = props.variants;
	const transition = props.transition;

	// We pass a dummy parser that just passes through styles,
	// because UIScale doesn't use CSS webStyle mappings.
	const { animatedProps, staticProps } = useVariantResolver(
		animate,
		initial,
		variants,
		transition,
		(style) => style as Record<string, unknown>
	);

	const uiscaleProps = {
		...(props as unknown as Record<string, unknown>),
	} as Record<string, unknown>;

	uiscaleProps.animate = undefined;
	uiscaleProps.initial = undefined;
	uiscaleProps.variants = undefined;
	uiscaleProps.transition = undefined;
	uiscaleProps._motionUIScaleProps = undefined;

	return (
		<uiscale
			ref={ref}
			{...uiscaleProps}
			{...staticProps}
			{...animatedProps}
		/>
	);
});
