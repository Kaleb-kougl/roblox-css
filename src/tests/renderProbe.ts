/**
 * renderProbe.ts — Test helper for forwardRef primitives that call hooks.
 *
 * Several specs assert on the *element* a primitive returns rather than on a
 * mounted instance, by calling `Component.render(props, ref)` directly. That
 * works only while the component is hook-free: React installs its hook
 * dispatcher for the duration of a render pass, so a `useRef` reached from
 * outside one throws "Invalid hook call".
 *
 * The primitives call useWebStyle() to cache style parsing, so this helper
 * supplies the missing render context — a probe component invokes the render
 * function during its own render and we capture what it returned, without
 * mounting that element. The element-shape assertions stay exactly as written.
 */

import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";

export function renderElement<T>(
	render: (props: unknown, ref: unknown) => T,
	props: unknown,
	ref: unknown = undefined,
): T {
	let captured: T | undefined;

	const Probe: React.FC = () => {
		captured = render(props, ref);
		// The captured element is inspected, not mounted.
		return undefined;
	};

	const container = new Instance("Folder");
	const root = ReactRoblox.createRoot(container);
	ReactRoblox.act(() => {
		root.render(React.createElement(Probe));
	});
	ReactRoblox.act(() => {
		root.unmount();
	});
	container.Destroy();

	return captured as T;
}
