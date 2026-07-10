/**
 * ScreenContainer.tsx — A ScreenGui wrapper for on-screen Roblox UI.
 *
 * Provides the top-level container that should be parented into StarterGui or
 * PlayerGui by the consuming experience. Descendant primitives remain ordinary
 * GuiObjects such as Frame, TextLabel, TextButton, and ScrollingFrame.
 */

import React from "@rbxts/react";
import { DeepReadonly } from "../types";

export type ScreenContainerProps = React.PropsWithChildren<React.ComponentProps<"screengui">> & {
	readonly _screenContainerProps?: unique symbol;
};

export function makeScreenContainerProps(
	props: Omit<ScreenContainerProps, "_screenContainerProps">,
): DeepReadonly<ScreenContainerProps> {
	return props as unknown as DeepReadonly<ScreenContainerProps>;
}

export const ScreenContainer = React.forwardRef<ScreenGui, ScreenContainerProps>((props, ref) => {
	const children = props.children;

	const defaultProps = {
		Enabled: true,
		DisplayOrder: 0,
		ResetOnSpawn: false,
		ScreenInsets: Enum.ScreenInsets.CoreUISafeInsets,
		ZIndexBehavior: Enum.ZIndexBehavior.Sibling,
	} as Record<string, unknown>;

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.children = undefined;

	return (
		<screengui ref={ref} {...defaultProps} {...explicitProps}>
			{children}
		</screengui>
	);
});
