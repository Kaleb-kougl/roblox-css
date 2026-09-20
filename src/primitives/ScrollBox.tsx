/**
 * ScrollBox.tsx — A scrollable container component for Roblox.
 *
 * Provides a scrollable <div> equivalent that supports a web-like CSS syntax (`style` prop).
 * It automatically translates CSS properties (e.g., `backgroundColor: "red"`) into
 * Roblox engine equivalents (`BackgroundColor3`) and injects layout constraints
 * like `UICorner`, `UIPadding`, `UIListLayout`, and `UIGridLayout` as child instances.
 *
 * Mirrors the architecture of Box.tsx but renders a native <scrollingframe> instead
 * of a <frame>, with clean defaults for a modern scrolling experience.
 *
 * Usage:
 *   <ScrollBox style={{ width: "100%", height: "300px", display: "flex", gap: "8px" }}>
 *     <textlabel Text="Item 1" />
 *     <textlabel Text="Item 2" />
 *   </ScrollBox>
 */

import React from "@rbxts/react";
import { CSSProperties } from "../styles/webStyle";
import { useWebStyle } from "./useWebStyle";

export type ScrollBoxProps = React.PropsWithChildren<React.ComponentProps<"scrollingframe">> & {
	style?: CSSProperties;
} & { readonly _scrollBoxProps?: unique symbol };

export const ScrollBox = React.forwardRef<ScrollingFrame, ScrollBoxProps>((props, ref) => {
	const style = props.style;
	const children = props.children;

	const defaultProps = {
		BackgroundTransparency: 1,
		BorderSizePixel: 0,
		ScrollBarThickness: 4,
		ScrollBarImageTransparency: 0.5,
		CanvasSize: new UDim2(0, 0, 0, 0),
		AutomaticCanvasSize: Enum.AutomaticSize.Y,
	} as Record<string, unknown>;

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.style = undefined;
	explicitProps.children = undefined;

	// Cached across renders while the style values are unchanged — see useWebStyle.
	const parsedStyle = useWebStyle(style);

	if (parsedStyle !== undefined) {
		return (
			<scrollingframe ref={ref} {...defaultProps} {...parsedStyle.props} {...explicitProps}>
				{parsedStyle.children}
				{children}
			</scrollingframe>
		);
	}

	return (
		<scrollingframe ref={ref} {...defaultProps} {...explicitProps}>
			{children}
		</scrollingframe>
	);
});
