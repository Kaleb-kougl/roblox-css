/**
 * Box.tsx — The foundational UI container component for Roblox.
 *
 * Provides a <div> equivalent that supports a web-like CSS syntax (`style` prop).
 * It automatically translates CSS properties (e.g., `backgroundColor: "red"`) into 
 * Roblox engine equivalents (`BackgroundColor3`) and injects layout constraints 
 * like `UICorner`, `UIPadding`, `UIListLayout`, and `UIGridLayout` as child instances.
 * 
 * Usage:
 *   <Box style={{ width: "100%", height: "50px", backgroundColor: "#333", borderRadius: "8px" }}>
 *     <textlabel Text="Hello World" />
 *   </Box>
 */

import React, { useRef } from "@rbxts/react";
import { CSSProperties, webStyle } from "../styles/webStyle";
import { DeepReadonly } from "../types";
import { ParentSizeContext } from "../styles/ParentSizeContext";
import { usePercentageConstraints } from "./usePercentageConstraints";

export type BoxProps = React.PropsWithChildren<React.ComponentProps<"frame">> & {
	style?: CSSProperties;
} & { readonly _boxProps?: unique symbol };

export function makeBoxProps(props: Omit<BoxProps, "_boxProps">): DeepReadonly<BoxProps> {
	return props as unknown as DeepReadonly<BoxProps>;
}

export const Box = React.forwardRef<Frame, BoxProps>((props, ref) => {
	const style = props.style;
	const children = props.children;

	const defaultProps = {
		BackgroundTransparency: 1,
		BorderSizePixel: 0,
	} as Record<string, unknown>;

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.style = undefined;
	explicitProps.children = undefined;

	// Merge user-provided Change listeners with our internal AbsoluteSize tracker
	// to avoid silently overwriting user event handlers.
	const userChange = (props.Change as Record<string, unknown>) ?? {};
	const mergedChange: Record<string, unknown> = { ...userChange };
	mergedChange.AbsoluteSize = (rbx: Frame) => {
		setAbsSize(rbx.AbsoluteSize);
		// Forward to user handler if present
		const userHandler = userChange.AbsoluteSize as ((rbx: Frame) => void) | undefined;
		if (userHandler !== undefined) userHandler(rbx);
	};
	explicitProps.Change = undefined;

	const bindingRef = useRef<{ binding: React.Binding<Vector2>; set: (v: Vector2) => void }>();
	if (!bindingRef.current) {
		const [binding, setBinding] = React.createBinding(new Vector2(math.huge, math.huge));
		bindingRef.current = { binding, set: setBinding };
	}
	const { binding: absSize, set: setAbsSize } = bindingRef.current;

	const percentageConstraint = usePercentageConstraints(style);

	if (style) {
		const parsedStyle = webStyle(style);

		return (
			<ParentSizeContext.Provider value={absSize}>
				<frame
					ref={ref}
					{...defaultProps}
					{...parsedStyle.props}
					{...explicitProps}
					Change={mergedChange}
				>
					{parsedStyle.children}
					{percentageConstraint}
					{children}
				</frame>
			</ParentSizeContext.Provider>
		);
	}

	return (
		<ParentSizeContext.Provider value={absSize}>
			<frame
				ref={ref}
				{...defaultProps}
				{...explicitProps}
				Change={mergedChange}
			>
				{children}
			</frame>
		</ParentSizeContext.Provider>
	);
});
