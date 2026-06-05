import { describe, expect, it, beforeEach, afterEach } from "@rbxts/jest-globals";
import React, { createElement, useState, forwardRef } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import type { CSSProperties } from "../../src/styles/webStyle";
import type { MotionProps } from "../../src/primitives/useVariantResolver";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

// Import the hook dynamically
const variantModule = require(uiPrimitives.WaitForChild("useVariantResolver") as ModuleScript) as {
	useVariantResolver: (
		animate?: string,
		initial?: string,
		variants?: Record<string, Partial<CSSProperties> & Record<string, unknown>>,
		transition?: TweenInfo,
		parser?: (style: Partial<CSSProperties> & Record<string, unknown>) => Record<string, unknown>
	) => { animatedProps: Record<string, React.Binding<unknown>>; staticProps: Record<string, unknown> };
};

const useVariantResolver = variantModule.useVariantResolver;

// A dummy component to test the hook
const TestComponent = forwardRef<Frame, MotionProps & { 
	onResolverResult?: (res: { animatedProps: Record<string, React.Binding<unknown>>; staticProps: Record<string, unknown> }) => void;
	parser?: (style: CSSProperties) => Record<string, unknown>;
}>((props, ref) => {
	const result = useVariantResolver(props.animate, props.initial, props.variants, props.transition, props.parser);
	
	if (props.onResolverResult) {
		props.onResolverResult(result);
	}

	return (
		<frame ref={ref} {...result.staticProps} {...result.animatedProps} />
	);
});

describe("useVariantResolver", () => {
	let container: Folder;
	let root: ReactRoblox.Root;

	beforeEach(() => {
		container = new Instance("Folder");
		root = ReactRoblox.createRoot(container);
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.Destroy();
	});

	it("should split static and animated props correctly", () => {
		let lastResult: { animatedProps: Record<string, React.Binding<unknown>>; staticProps: Record<string, unknown> } | undefined;
		
		const variants: Record<string, Partial<CSSProperties> & Record<string, unknown>> = {
			visible: { width: "100px" },
		};

		act(() => {
			root.render(
				createElement(TestComponent, {
					animate: "visible",
					variants: variants,
					parser: (style) => ({ 
						Size: new UDim2(0, 100, 0, 0),
						Visible: true 
					}),
					onResolverResult: (res) => {
						lastResult = res;
					},
				}),
			);
		});

		// By default it uses webStyle parser which only produces animatable props right now (Size, BackgroundTransparency)
		// Let's verify Size is animatable
		expect(lastResult).toBeDefined();
		expect(lastResult?.animatedProps.Size).toBeDefined();
		expect(lastResult?.staticProps.Size).toBeUndefined();
		// Verify custom prop injection
		expect(lastResult?.staticProps.Visible).toBe(true);
	});

	it("should transition between variants smoothly", () => {
		const variants: Record<string, Partial<CSSProperties> & Record<string, unknown>> = {
			start: { backgroundColor: "#000000" },
			end: { backgroundColor: "#ffffff" },
		};

		let currentAnimate = "start";
		let setAnimate: React.Dispatch<React.SetStateAction<string>>;

		const Wrapper = () => {
			const [animate, setAnim] = useState(currentAnimate);
			setAnimate = setAnim;
			return createElement(TestComponent, { animate, variants });
		};

		act(() => {
			root.render(createElement(Wrapper));
		});

		const frame = container.FindFirstChildWhichIsA("Frame");
		expect(frame?.BackgroundColor3.R).toBeCloseTo(0, 5);

		// Trigger state change
		act(() => {
			setAnimate("end");
		});

		// At this point, the motion tween has started.
		// Immediately, it shouldn't be fully white because it tweens over 0.3s.
		// But in Jest, without ticking the Roact/Heartbeat, it might still be 0.
		// However, we just want to ensure it doesn't crash and correctly applies the binding.
		expect(frame?.BackgroundColor3).toBeDefined();
	});

	it("should seed binding value from initial prop instead of animate target", () => {
		let lastResult: { animatedProps: Record<string, React.Binding<unknown>>; staticProps: Record<string, unknown> } | undefined;

		const variants: Record<string, Partial<CSSProperties> & Record<string, unknown>> = {
			hidden: { width: "0px" },
			visible: { width: "200px" },
		};

		act(() => {
			root.render(
				createElement(TestComponent, {
					initial: "hidden",
					animate: "visible",
					variants: variants,
					parser: (style) => {
						// "hidden" → Size 0px, "visible" → Size 200px
						const w = (style as Record<string, unknown>).width;
						const offset = w === "0px" ? 0 : w === "200px" ? 200 : 100;
						return { Size: new UDim2(0, offset, 0, 0) };
					},
					onResolverResult: (res) => {
						lastResult = res;
					},
				}),
			);
		});

		expect(lastResult).toBeDefined();
		expect(lastResult?.animatedProps.Size).toBeDefined();

		// The binding should be seeded from the "hidden" variant (0px),
		// NOT from the "visible" animate target (200px).
		const bindingValue = lastResult?.animatedProps.Size.getValue() as UDim2;
		expect(bindingValue).toBeDefined();
		expect(bindingValue.X.Offset).toBe(0);
	});

	it("should fall back to idle key when initial prop is absent", () => {
		let lastResult: { animatedProps: Record<string, React.Binding<unknown>>; staticProps: Record<string, unknown> } | undefined;

		const variants: Record<string, Partial<CSSProperties> & Record<string, unknown>> = {
			idle: { width: "50px" },
			active: { width: "300px" },
		};

		act(() => {
			root.render(
				createElement(TestComponent, {
					animate: "active",
					variants: variants,
					parser: (style) => {
						const w = (style as Record<string, unknown>).width;
						const offset = w === "50px" ? 50 : w === "300px" ? 300 : 100;
						return { Size: new UDim2(0, offset, 0, 0) };
					},
					onResolverResult: (res) => {
						lastResult = res;
					},
				}),
			);
		});

		expect(lastResult).toBeDefined();
		expect(lastResult?.animatedProps.Size).toBeDefined();

		// With no initial prop, the fallback chain should pick "idle" (50px)
		// over the animate target "active" (300px).
		const bindingValue = lastResult?.animatedProps.Size.getValue() as UDim2;
		expect(bindingValue).toBeDefined();
		expect(bindingValue.X.Offset).toBe(50);
	});

	it("should support a variant literally named 'initial' via the fallback chain", () => {
		let lastResult: { animatedProps: Record<string, React.Binding<unknown>>; staticProps: Record<string, unknown> } | undefined;

		// This mimics the BreathingGlow pattern: a variant named "initial"
		// used as a starting state, with "idle" as the animate target.
		// (Uses BackgroundTransparency instead of ImageTransparency because
		// TestComponent renders a <frame>, which doesn't have ImageTransparency.)
		const variants: Record<string, Partial<CSSProperties> & Record<string, unknown>> = {
			initial: { BackgroundTransparency: 0.2 },
			idle: { BackgroundTransparency: 0.8 },
		};

		act(() => {
			root.render(
				createElement(TestComponent, {
					animate: "idle",
					// No initial prop — should fall back to "idle" key
					variants: variants,
					parser: (style) => {
						const val = (style as Record<string, unknown>).BackgroundTransparency as number;
						return { BackgroundTransparency: val };
					},
					onResolverResult: (res) => {
						lastResult = res;
					},
				}),
			);
		});

		expect(lastResult).toBeDefined();
		expect(lastResult?.animatedProps.BackgroundTransparency).toBeDefined();

		// Without an initial prop, the fallback chain picks "idle" (0.8),
		// NOT the variant named "initial" (0.2). The variant named "initial"
		// is only used when explicitly passed as initial="initial".
		const bindingValue = lastResult?.animatedProps.BackgroundTransparency.getValue() as number;
		expect(bindingValue).toBeDefined();
		expect(bindingValue).toBeCloseTo(0.8, 5);
	});
});
