import { describe, expect, it } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import type { TextProps } from "../../src/primitives/Text";

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

interface TestElement {
	type: string;
	props: Record<string, unknown>;
	ref: unknown;
}

// The Text component is exported as Text, makeTextProps is exported as makeTextProps
const textModule = require(uiPrimitives.WaitForChild("Text") as ModuleScript) as {
	Text: React.FC<TextProps> & { render: (props: unknown, ref: unknown) => TestElement };
	makeTextProps: (props: unknown) => TextProps;
};

const Text = textModule.Text;
const makeTextProps = textModule.makeTextProps;

describe("Text primitives", () => {
	describe("makeTextProps", () => {
		it("should return the exact same object provided (branded cast)", () => {
			const input = { Text: "Hello" };
			const result = makeTextProps(input);
			expect(result).toBe(input);
		});

		it("should preserve identity of empty objects", () => {
			const input = {};
			const result = makeTextProps(input);
			expect(result).toBe(input);
		});
	});

	describe("Text component", () => {
		// Helper to render the Text directly since it's a forwardRef component.
		// forwardRef components in React have a .render function that we can call
		// directly to test what element they produce without mounting.
		const renderText = (props: unknown, ref: unknown = undefined) => {
			return Text.render(props, ref);
		};

		it("should render a textlabel element with default props", () => {
			const element = renderText({});
			
			expect(element).toBeDefined();
			expect(element.type).toBe("TextLabel");
			expect(element.props.BackgroundTransparency).toBe(1);
			expect(element.props.TextWrapped).toBe(true);
		});

		it("should pass explicit props to textlabel", () => {
			const element = renderText({ BackgroundTransparency: 0.5, Text: "Explicit" });
			
			expect(element.props.BackgroundTransparency).toBe(0.5);
			expect(element.props.Text).toBe("Explicit");
		});

		it("should map primitive string children directly to Text property", () => {
			const element = renderText({ children: "String Child" });
			expect(element.props.Text).toBe("String Child");
			// primitive children should not be rendered in the tree
			const childrenArray = element.props.children as unknown[];
			expect(childrenArray[1]).toBeUndefined(); 
		});

		it("should map primitive number children directly to Text property", () => {
			const element = renderText({ children: 12345 });
			expect(element.props.Text).toBe("12345");
			const childrenArray = element.props.children as unknown[];
			expect(childrenArray[1]).toBeUndefined();
		});

		it("should render React element children normally", () => {
			const mockChild = React.createElement("uicorner", { CornerRadius: new UDim(0, 5) });
			const element = renderText({ children: mockChild });
			
			const childrenArray = element.props.children as unknown[];
			expect(childrenArray[1]).toBe(mockChild);
			expect(element.props.Text).toBe(""); // default empty text to prevent "Label"
		});

		it("should map fontSize to TextSize", () => {
			const element = renderText({ style: { fontSize: 24 } });
			expect(element.props.TextSize).toBe(24);
		});

		it("should map textAlign to TextXAlignment", () => {
			let element = renderText({ style: { textAlign: "center" } });
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Center);

			element = renderText({ style: { textAlign: "right" } });
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Right);

			element = renderText({ style: { textAlign: "left" } });
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Left);

			element = renderText({ style: { textAlign: "unknown" } });
			expect(element.props.TextXAlignment).toBeUndefined(); // webStyle skips unknown values
		});

		it("should map whiteSpace to TextWrapped", () => {
			let element = renderText({ style: { whiteSpace: "nowrap" } });
			expect(element.props.TextWrapped).toBe(false);

			element = renderText({ style: { whiteSpace: "normal" } });
			expect(element.props.TextWrapped).toBe(true);
		});

		it("should map wordBreak variants correctly", () => {
			let element = renderText({ style: { wordBreak: "normal" } });
			expect(element.props.TextWrapped).toBe(true);

			element = renderText({ style: { wordBreak: "break-word" } });
			expect(element.props.TextWrapped).toBe(true);

			element = renderText({ style: { wordBreak: "break-all" }, Text: "Hello" });
			expect(element.props.TextWrapped).toBe(true);
			expect(element.props.Text).toBe("H\u{200B}e\u{200B}l\u{200B}l\u{200B}o");

			element = renderText({ style: { wordBreak: "keep-all" }, Text: "Hello World" });
			expect(element.props.TextWrapped).toBe(false);
			expect(element.props.Text).toBe("Hello\nWorld");
		});

		it("should map color to TextColor3 and handle transparency", () => {
			let element = renderText({ style: { color: "#ff0000" } });
			let color = element.props.TextColor3 as Color3;
			expect(color).toBeDefined();
			expect(color.R).toBeCloseTo(1, 5);
			expect(color.G).toBeCloseTo(0, 5);
			expect(color.B).toBeCloseTo(0, 5);
			expect(element.props.TextTransparency).toBeUndefined();

			element = renderText({ style: { color: "transparent" } });
			expect(element.props.TextTransparency).toBe(1);
		});

		it("should map fontFamily and fontWeight to FontFace", () => {
			// Default family, regular weight if only fontFamily is given
			let element = renderText({ style: { fontFamily: "Montserrat" } });
			let fontFace = element.props.FontFace as Font;
			expect(fontFace).toBeDefined();
			expect(fontFace.Family).toBe("rbxasset://fonts/families/Montserrat.json");
			expect(fontFace.Weight).toBe(Enum.FontWeight.Regular);

			// Bold weight, default family
			element = renderText({ style: { fontWeight: "bold" } });
			fontFace = element.props.FontFace as Font;
			expect(fontFace).toBeDefined();
			expect(fontFace.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
			expect(fontFace.Weight).toBe(Enum.FontWeight.Bold);

			// Black weight
			element = renderText({ style: { fontWeight: "black" } });
			fontFace = element.props.FontFace as Font;
			expect(fontFace.Weight).toBe(Enum.FontWeight.Heavy);

			// Unknown weight fallback
			element = renderText({ style: { fontWeight: "unknown" } });
			fontFace = element.props.FontFace as Font;
			expect(fontFace.Weight).toBe(Enum.FontWeight.Regular);
		});

		it("should apply webStyle and merge its props and children", () => {
			const element = renderText({
				style: {
					width: "100px",
					borderRadius: "5px",
				},
				Text: "WebStyle Test",
			});
			
			expect(element.type).toBe("TextLabel");
			
			// Explicit props preserved
			expect(element.props.Text).toBe("WebStyle Test");
			
			// Style props mapped
			const size = element.props.Size as UDim2;
			expect(size).toBeDefined();
			expect(size.X.Offset).toBe(100);
			
			// Style children injected
			expect(element.props.children).toBeDefined();
			
			const childrenArray = element.props.children as unknown[];
			const parsedChildren = childrenArray[0] as TestElement[];
			
			expect(parsedChildren).toBeDefined();
			expect(parsedChildren.size()).toBe(1);
			expect(parsedChildren[0].type).toBe("UICorner");
			expect((parsedChildren[0].props.CornerRadius as UDim).Offset).toBe(5);
		});

		it("should forward refs correctly", () => {
			const mockRef = React.createRef<TextLabel>();
			const element = renderText({}, mockRef);
			expect(element.ref).toBe(mockRef);
		});

		it("should forward refs correctly when style is provided", () => {
			const mockRef = React.createRef<TextLabel>();
			const element = renderText({ style: { width: "10px" } }, mockRef);
			expect(element.ref).toBe(mockRef);
		});

		it("should apply textTransform uppercase", () => {
			const element = renderText({ children: "hello", style: { textTransform: "uppercase" } });
			expect(element.props.Text).toBe("HELLO");
		});

		it("should apply textTransform lowercase", () => {
			const element = renderText({ children: "HELLO", style: { textTransform: "lowercase" } });
			expect(element.props.Text).toBe("hello");
		});

		it("should apply textTransform capitalize", () => {
			const element = renderText({ children: "hello world", style: { textTransform: "capitalize" } });
			expect(element.props.Text).toBe("Hello World");
		});

		it("should apply textTransform none (unchanged)", () => {
			const element = renderText({ children: "Hello", style: { textTransform: "none" } });
			expect(element.props.Text).toBe("Hello");
		});

		it("should apply textDecoration underline", () => {
			const element = renderText({ children: "Hello", style: { textDecoration: "underline" } });
			expect(element.props.Text).toBe("<u>Hello</u>");
		});

		it("should apply textDecoration line-through", () => {
			const element = renderText({ children: "Hello", style: { textDecoration: "line-through" } });
			expect(element.props.Text).toBe("<s>Hello</s>");
		});

		it("should apply textDecoration none (unchanged)", () => {
			const element = renderText({ children: "Hello", style: { textDecoration: "none" } });
			expect(element.props.Text).toBe("Hello");
		});
	});
});
