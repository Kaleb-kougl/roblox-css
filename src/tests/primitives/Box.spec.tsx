import { describe, expect, it, beforeEach, afterEach } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import type { BoxProps } from "../../primitives/Box";

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

interface TestElement {
	type: string;
	props: Record<string, unknown>;
	ref: unknown;
}

// The Box component is exported as Box, makeBoxProps is exported as makeBoxProps
const boxModule = require(uiPrimitives.WaitForChild("Box") as ModuleScript) as {
	Box: React.FC<BoxProps> & { render: (props: unknown, ref: unknown) => TestElement };
	makeBoxProps: (props: unknown) => BoxProps;
};

const Box = boxModule.Box;
const makeBoxProps = boxModule.makeBoxProps;

describe("Box primitives", () => {
	describe("makeBoxProps", () => {
		it("should return the exact same object provided (branded cast)", () => {
			const input = { Size: new UDim2(1, 0, 1, 0) };
			const result = makeBoxProps(input);
			expect(result).toBe(input);
		});

		it("should preserve identity of empty objects", () => {
			const input = {};
			const result = makeBoxProps(input);
			expect(result).toBe(input);
		});
	});

	describe("Box component", () => {
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

		const renderBox = (props: unknown, ref: unknown = undefined) => {
			act(() => {
				root.render(React.createElement(Box, { ...(props as Record<string, unknown>), ref: ref as React.Ref<Frame> }));
			});
			return container.GetChildren()[0] as Frame;
		};

		// Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		// Converted to mounted test because Box now uses hooks unconditionally.
		it("should render a frame element without style", () => {
			const element = renderBox({ BackgroundTransparency: 0.5 });
			
			expect(element).toBeDefined();
			expect(element.ClassName).toBe("Frame");
			expect(element.BackgroundTransparency).toBe(0.5);
		});

		// Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		// Converted to mounted test because Box now uses hooks unconditionally.
		it("should apply webStyle and merge its props and children", () => {
			const element = renderBox({
				style: {
					width: "100px",
					borderRadius: "5px",
				},
				BackgroundTransparency: 0.5,
			});
			
			expect(element.ClassName).toBe("Frame");
			expect(element.BackgroundTransparency).toBe(0.5);
			
			const size = element.Size;
			expect(size).toBeDefined();
			expect(size.X.Offset).toBe(100);
			expect(size.Y.Scale).toBeCloseTo(1, 5);
			
			const uiCorner = element.FindFirstChildWhichIsA("UICorner");
			expect(uiCorner).toBeDefined();
			expect(uiCorner!.CornerRadius.Offset).toBe(5);
		});

		// Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		// Converted to mounted test because Box now uses hooks unconditionally.
		it("should let explicit props override style props due to spread order", () => {
			const element = renderBox({
				BackgroundColor3: new Color3(1, 1, 1),
				style: {
					backgroundColor: "#000000",
				},
			});
			
			const color = element.BackgroundColor3;
			expect(color.R).toBe(1);
			expect(color.G).toBe(1);
			expect(color.B).toBe(1);
		});

		// Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		// Converted to mounted test because Box now uses hooks unconditionally.
		it("should render explicit children alongside style children", () => {
			const mockChild = React.createElement("TextLabel", { Text: "Hello World" });
			const element = renderBox({
				style: { padding: "10px" },
				children: mockChild,
			});

			expect(element.ClassName).toBe("Frame");
			
			const uiPadding = element.FindFirstChildWhichIsA("UIPadding");
			expect(uiPadding).toBeDefined();
			
			const childText = element.FindFirstChildWhichIsA("TextLabel");
			expect(childText).toBeDefined();
			expect(childText!.Text).toBe("Hello World");
		});

		// Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		// Converted to mounted test because Box now uses hooks unconditionally.
		it("should forward refs correctly", () => {
			const mockRef = React.createRef<Frame>();
			const element = renderBox({}, mockRef);
			
			expect(mockRef.current).toBe(element);
		});

		// Updated: Box now wraps in ParentSizeContext.Provider (ADR-0004)
		// Converted to mounted test because Box now uses hooks unconditionally.
		it("should forward refs correctly when style is provided", () => {
			const mockRef = React.createRef<Frame>();
			const element = renderBox({ style: { width: "10px" } }, mockRef);
			
			expect(mockRef.current).toBe(element);
		});
	});
});
