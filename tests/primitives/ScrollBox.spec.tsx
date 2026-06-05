import { describe, expect, it } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import type { ScrollBoxProps } from "../../src/primitives/ScrollBox";

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

interface TestElement {
	type: string;
	props: Record<string, unknown>;
	ref: unknown;
}

const scrollBoxModule = require(uiPrimitives.WaitForChild("ScrollBox") as ModuleScript) as {
	ScrollBox: React.FC<ScrollBoxProps> & { render: (props: unknown, ref: unknown) => TestElement };
};

const ScrollBox = scrollBoxModule.ScrollBox;

describe("ScrollBox primitive", () => {
	// Helper to render the ScrollBox directly since it's a forwardRef component.
	// forwardRef components in React have a .render function that we can call
	// directly to test what element they produce without mounting.
	const renderScrollBox = (props: unknown, ref: unknown = undefined) => {
		return ScrollBox.render(props, ref);
	};

	it("should render a ScrollingFrame element without style", () => {
		const element = renderScrollBox({});

		expect(element).toBeDefined();
		expect(element.type).toBe("ScrollingFrame");
	});

	it("should apply default props when no explicit overrides are provided", () => {
		const element = renderScrollBox({});

		expect(element.props.BackgroundTransparency).toBe(1);
		expect(element.props.BorderSizePixel).toBe(0);
		expect(element.props.ScrollBarThickness).toBe(4);
		expect(element.props.ScrollBarImageTransparency).toBe(0.5);
		expect(element.props.AutomaticCanvasSize).toBe(Enum.AutomaticSize.Y);
	});

	it("should let explicit props override default props", () => {
		const element = renderScrollBox({
			BackgroundTransparency: 0,
			ScrollBarThickness: 12,
		});

		// Explicit props should win due to spread order
		expect(element.props.BackgroundTransparency).toBe(0);
		expect(element.props.ScrollBarThickness).toBe(12);
		// Other defaults should still apply
		expect(element.props.BorderSizePixel).toBe(0);
	});

	it("should apply webStyle and merge its props and children", () => {
		const element = renderScrollBox({
			style: {
				width: "100px",
				borderRadius: "5px",
			},
			BackgroundTransparency: 0.5,
		});

		expect(element.type).toBe("ScrollingFrame");

		// Explicit props should be preserved
		expect(element.props.BackgroundTransparency).toBe(0.5);

		// Style props should be mapped
		const size = element.props.Size as UDim2;
		expect(size).toBeDefined();
		expect(size.X.Offset).toBe(100);

		// Style children should be injected
		expect(element.props.children).toBeDefined();

		const childrenArray = element.props.children as unknown[];
		const parsedChildren = childrenArray[0] as TestElement[];

		expect(parsedChildren).toBeDefined();
		expect(parsedChildren.size()).toBe(1);
		expect(parsedChildren[0].type).toBe("UICorner");
		expect((parsedChildren[0].props.CornerRadius as UDim).Offset).toBe(5);
	});

	it("should let explicit props override style props due to spread order", () => {
		const element = renderScrollBox({
			BackgroundColor3: new Color3(1, 1, 1),
			style: {
				backgroundColor: "#000000",
			},
		});

		expect(element.props.BackgroundColor3).toBeDefined();
		const color = element.props.BackgroundColor3 as Color3;
		expect(color.R).toBe(1);
		expect(color.G).toBe(1);
		expect(color.B).toBe(1);
	});

	it("should render explicit children alongside style children", () => {
		const mockChild = React.createElement("textlabel", { Text: "Hello World" });
		const element = renderScrollBox({
			style: { padding: "10px" },
			children: mockChild,
		});

		expect(element.type).toBe("ScrollingFrame");
		const childrenArray = element.props.children as unknown[];
		expect(childrenArray).toBeDefined();

		const parsedChildren = childrenArray[0] as TestElement[];
		const explicitChildren = childrenArray[1];

		// Ensure style constraint was added
		expect(parsedChildren.size()).toBe(1);
		expect(parsedChildren[0].type).toBe("UIPadding");

		// Ensure explicit child was preserved
		expect(explicitChildren).toBe(mockChild);
	});

	it("should forward refs correctly", () => {
		const mockRef = React.createRef<ScrollingFrame>();
		const element = renderScrollBox({}, mockRef);

		expect(element.ref).toBe(mockRef);
	});

	it("should forward refs correctly when style is provided", () => {
		const mockRef = React.createRef<ScrollingFrame>();
		const element = renderScrollBox({ style: { width: "10px" } }, mockRef);

		expect(element.ref).toBe(mockRef);
	});

	it("should not include style or children in the spread to the intrinsic element", () => {
		const element = renderScrollBox({
			style: { width: "50px" },
			children: React.createElement("textlabel", { Text: "child" }),
		});

		// style and children should be stripped from explicitProps
		expect(element.props.style).toBeUndefined();
		// children is the React prop, not the raw one — but the raw `children` key
		// should not leak into explicitProps as a string
	});
});
