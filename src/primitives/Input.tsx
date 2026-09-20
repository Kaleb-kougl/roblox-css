/**
 * Input.tsx — <input> equivalent for Roblox.
 *
 * Renders a <textbox> with web-like style props.
 * Extends the core webStyle translation by adding input-specific mappings.
 * Automatically maps web-like placeholder and onChange props to their
 * Roblox equivalents for a more familiar developer experience.
 *
 * Input mappings:
 *   Web Property        → Roblox Output
 *   ─────────────────────────────────────────────────────────
 *   placeholder         → PlaceholderText (string)
 *   onChange(text)      → Change.Text (event listener)
 *   style               → (Maps via webStyle)
 *
 * Maps to: HTML <input> → Roblox <textbox>
 *
 * Usage:
 *   <Input
 *     placeholder="Enter your name..."
 *     onChange={(text) => print("User typed:", text)}
 *     style={{ width: 200, height: 40, backgroundColor: "#FFFFFF" }}
 *   />
 */

import React from "@rbxts/react";
import { CSSProperties } from "../styles/webStyle";
import { useWebStyle } from "./useWebStyle";
import { DeepReadonly } from "../types";

/**
 * Branded InputProps — the `_inputProps` brand ensures strict nominal typing.
 * This prevents accidental bypasses or incorrect prop structures.
 */
export type InputProps = React.PropsWithChildren<React.ComponentProps<"textbox">> & {
	/**
	 * Web-like CSS styling object that automatically maps to Roblox properties
	 * and injects necessary UI constraints (UICorner, UIPadding, UIListLayout).
	 */
	style?: CSSProperties;
	/**
	 * Web-like alias for PlaceholderText.
	 * Sets the text that appears when the input is empty.
	 */
	placeholder?: string;
	/**
	 * Fired when the text changes.
	 * Automatically maps to Roblox's `Change.Text` event.
	 */
	onChange?: (text: string) => void;
} & { readonly _inputProps?: unique symbol };

/** Helper to construct a branded InputProps. */
export function makeInputProps(props: Omit<InputProps, "_inputProps">): DeepReadonly<InputProps> {
	return props as unknown as DeepReadonly<InputProps>;
}

/**
 * Input component — The primary component for receiving user text input.
 *
 * Maps to: HTML <input> → Roblox <textbox>
 * Renders a native <textbox> while mapping web input props to Roblox properties.
 */
export const Input = React.forwardRef<TextBox, InputProps>((props, ref) => {
	const style = props.style;
	const children = props.children;
	const placeholder = props.placeholder;
	const onChange = props.onChange;

	const defaultProps = {
		BackgroundTransparency: 1, // Default transparent background
		Text: "", // Default empty text instead of 'TextBox'
	} as Record<string, unknown>;

	const explicitProps = { ...props } as Record<string, unknown>;
	explicitProps.style = undefined;
	explicitProps.children = undefined;
	explicitProps.placeholder = undefined;
	explicitProps.onChange = undefined;

	if (placeholder !== undefined) {
		explicitProps.PlaceholderText = placeholder;
	}

	// Merge user-provided Change listeners with our internal Text handler
	// to avoid silently overwriting user event handlers.
	const userChange = (props.Change as Record<string, unknown>) ?? {};
	const mergedChange: Record<string, unknown> = { ...userChange };
	if (onChange) {
		mergedChange.Text = (rbx: TextBox) => {
			onChange(rbx.Text);
			// Forward to user handler if present
			const userHandler = userChange.Text as ((rbx: TextBox) => void) | undefined;
			if (userHandler !== undefined) userHandler(rbx);
		};
	}
	explicitProps.Change = undefined;

	const hasChange = onChange !== undefined || next(userChange)[0] !== undefined;

	// Cached across renders while the style values are unchanged — see useWebStyle.
	const parsed = useWebStyle(style);

	if (parsed !== undefined) {
		return (
			<textbox ref={ref} {...defaultProps} {...(parsed.props as Record<string, unknown>)} {...explicitProps} {...(hasChange ? { Change: mergedChange } : {})}>
				{parsed.children}
				{children}
			</textbox>
		);
	}

	return (
		<textbox ref={ref} {...defaultProps} {...explicitProps} {...(hasChange ? { Change: mergedChange } : {})}>
			{children}
		</textbox>
	);
});
