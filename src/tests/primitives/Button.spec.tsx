import { describe, expect, it } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import { renderElement } from "../renderProbe";
import type { ButtonProps } from "../../primitives/Button";

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

interface TestElement {
	type: string;
	props: Record<string, unknown>;
	ref: unknown;
}

// The Button component is exported as Button, makeButtonProps is exported as makeButtonProps
const buttonModule = require(uiPrimitives.WaitForChild("Button") as ModuleScript) as {
	Button: React.FC<ButtonProps> & { render: (props: unknown, ref: unknown) => TestElement };
	makeButtonProps: (props: unknown) => ButtonProps;
};

const Button = buttonModule.Button;
const makeButtonProps = buttonModule.makeButtonProps;

describe("Button primitives", () => {
	describe("makeButtonProps", () => {
		it("should return the exact same object provided (branded cast)", () => {
			const input = { Text: "Click me" };
			const result = makeButtonProps(input);
			expect(result).toBe(input);
		});

		it("should preserve identity of empty objects", () => {
			const input = {};
			const result = makeButtonProps(input);
			expect(result).toBe(input);
		});
	});

	describe("Button component", () => {
		// Helper to render the Button directly since it's a forwardRef component.
		const renderButton = (props: unknown, ref: unknown = undefined) => {
			// Runs through a probe component: the primitive calls hooks now.
			return renderElement(Button.render, props, ref);
		};

		it("should render a textbutton element without style", () => {
			const element = renderButton({ BackgroundTransparency: 0.5 });
			
			expect(element).toBeDefined();
			expect(element.type).toBe("TextButton");
			expect(element.props.BackgroundTransparency).toBe(0.5);
			expect(element.props.TextWrapped).toBe(true); // default value
			expect(element.props.Size).toBeUndefined();
		});

		it("should apply webStyle and merge its props and children", () => {
			const element = renderButton({
				style: {
					width: "100px",
					borderRadius: "5px",
				},
				BackgroundTransparency: 0.5,
			});
			
			expect(element.type).toBe("TextButton");
			expect(element.props.BackgroundTransparency).toBe(0.5);
			
			const size = element.props.Size as UDim2;
			expect(size).toBeDefined();
			expect(size.X.Offset).toBe(100);
			
			const childrenArray = element.props.children as unknown[];
			expect(childrenArray).toBeDefined();
			
			const parsedChildren = childrenArray[0] as TestElement[];
			expect(parsedChildren).toBeDefined();
			expect(parsedChildren.size()).toBe(1);
			expect(parsedChildren[0].type).toBe("UICorner");
			expect((parsedChildren[0].props.CornerRadius as UDim).Offset).toBe(5);
		});

		it("should let explicit props override style props due to spread order", () => {
			// Button.tsx uses: <textbutton {...defaultProps} {...parsedStyleProps} {...explicitProps}>
			// Therefore, explicit props should overwrite parsedStyleProps.
			const element = renderButton({
				BackgroundColor3: new Color3(1, 1, 1),
				style: {
					backgroundColor: "#000000",
				},
			});
			
			expect(element.props.BackgroundColor3).toBeDefined();
			const color = element.props.BackgroundColor3 as Color3;
			expect(color.R).toBe(1);
			expect(color.G).toBe(1);
			expect(color.B).toBe(1); // The explicit prop should win over #000000
		});

		it("should map primitive children to the Text property", () => {
			const strElement = renderButton({ children: "Hello World" });
			expect(strElement.props.Text).toBe("Hello World");
			
			const childrenArrayStr = strElement.props.children as unknown[];
			expect(childrenArrayStr[1]).toBeUndefined(); // React elements array child part is undefined

			const numElement = renderButton({ children: 42 });
			expect(numElement.props.Text).toBe("42");
			
			const childrenArrayNum = numElement.props.children as unknown[];
			expect(childrenArrayNum[1]).toBeUndefined();
		});

		it("should render explicit React elements as children instead of text", () => {
			const mockChild = React.createElement("frame");
			const element = renderButton({
				style: { padding: "10px" },
				children: mockChild,
			});

			expect(element.props.Text).toBe("");

			const childrenArray = element.props.children as unknown[];
			expect(childrenArray).toBeDefined();
			
			const parsedChildren = childrenArray[0] as TestElement[];
			const explicitChildren = childrenArray[1];
			
			expect(parsedChildren.size()).toBe(1);
			expect(parsedChildren[0].type).toBe("UIPadding");
			
			expect(explicitChildren).toBe(mockChild);
		});

		it("should map typography style properties", () => {
			const element = renderButton({
				style: {
					fontSize: 24,
					fontFamily: "rbxasset://fonts/families/Roboto.json",
					fontWeight: "bold",
					textAlign: "center",
					whiteSpace: "nowrap",
					color: "#ff0000"
				}
			});
			
			expect(element.props.TextSize).toBe(24);
			expect(element.props.TextXAlignment).toBe(Enum.TextXAlignment.Center);
			expect(element.props.TextWrapped).toBe(false);
			
			const font = element.props.FontFace as Font;
			expect(font).toBeDefined();
			expect(font.Family).toBe("rbxasset://fonts/families/Roboto.json");
			expect(font.Weight).toBe(Enum.FontWeight.Bold);
			
			const color = element.props.TextColor3 as Color3;
			expect(color).toBeDefined();
			expect(color.R).toBe(1);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);
			expect(element.props.TextTransparency).toBeUndefined();
		});

		it("should map typography style property defaults", () => {
			const element = renderButton({
				style: {
					fontFamily: undefined,
					fontWeight: "unknown", // triggers fallback to regular
				}
			});
			
			const font = element.props.FontFace as Font;
			expect(font).toBeDefined();
			expect(font.Family).toBe("rbxasset://fonts/families/SourceSansPro.json");
			expect(font.Weight).toBe(Enum.FontWeight.Regular);
		});

		it("should map transparent color", () => {
			const element = renderButton({
				style: { color: "transparent" }
			});
			expect(element.props.TextTransparency).toBe(1);
		});

		it("should map React-style event props to the Roblox Event table", () => {
			const mockOnClick = () => {};
			const mockOnMouseEnter = () => {};
			const mockOnMouseLeave = () => {};

			const element = renderButton({
				onClick: mockOnClick,
				onMouseEnter: mockOnMouseEnter,
				onMouseLeave: mockOnMouseLeave,
			});

			let foundActivated = false;
			let foundMouseEnter = false;
			let foundMouseLeave = false;

			for (const [key, value] of element.props as unknown as Map<unknown, unknown>) {
				if (value === mockOnClick) foundActivated = true;
				if (value === mockOnMouseEnter) foundMouseEnter = true;
				if (value === mockOnMouseLeave) foundMouseLeave = true;
			}

			expect(foundActivated).toBe(true);
			expect(foundMouseEnter).toBe(true);
			expect(foundMouseLeave).toBe(true);
		});

		it("should merge with existing Event table", () => {
			const existingActivated = () => {};
			const mockOnClick = () => {};
			
			const element = renderButton({
				onClick: mockOnClick,
				Event: {
					SelectionGained: existingActivated
				}
			});

			let foundActivated = false;
			let foundSelectionGained = false;

			for (const [key, value] of element.props as unknown as Map<unknown, unknown>) {
				if (value === mockOnClick) foundActivated = true;
				if (value === existingActivated) foundSelectionGained = true;
			}

			expect(foundActivated).toBe(true);
			expect(foundSelectionGained).toBe(true);
		});

		it("should forward refs correctly", () => {
			const mockRef = React.createRef<TextButton>();
			const element = renderButton({}, mockRef);
			
			expect(element.ref).toBe(mockRef);
		});

		it("should apply textTransform uppercase", () => {
			const element = renderButton({ children: "hello", style: { textTransform: "uppercase" } });
			expect(element.props.Text).toBe("HELLO");
		});

		it("should apply textTransform lowercase", () => {
			const element = renderButton({ children: "HELLO", style: { textTransform: "lowercase" } });
			expect(element.props.Text).toBe("hello");
		});

		it("should apply textTransform capitalize", () => {
			const element = renderButton({ children: "hello world", style: { textTransform: "capitalize" } });
			expect(element.props.Text).toBe("Hello World");
		});

		it("should apply textTransform none (unchanged)", () => {
			const element = renderButton({ children: "Hello", style: { textTransform: "none" } });
			expect(element.props.Text).toBe("Hello");
		});

		it("should apply textDecoration underline", () => {
			const element = renderButton({ children: "Hello", style: { textDecoration: "underline" } });
			expect(element.props.Text).toBe("<u>Hello</u>");
		});

		it("should apply textDecoration line-through", () => {
			const element = renderButton({ children: "Hello", style: { textDecoration: "line-through" } });
			expect(element.props.Text).toBe("<s>Hello</s>");
		});

		it("should apply textDecoration none (unchanged)", () => {
			const element = renderButton({ children: "Hello", style: { textDecoration: "none" } });
			expect(element.props.Text).toBe("Hello");
		});

		it("should apply wordBreak break-all with zero-width spaces", () => {
			const element = renderButton({ children: "Hello", style: { wordBreak: "break-all" } });
			expect(element.props.TextWrapped).toBe(true);
			expect(element.props.Text).toBe("H\u{200B}e\u{200B}l\u{200B}l\u{200B}o");
		});

		it("should apply wordBreak keep-all with newline replacement", () => {
			const element = renderButton({ children: "Hello World", style: { wordBreak: "keep-all" } });
			expect(element.props.TextWrapped).toBe(false);
			expect(element.props.Text).toBe("Hello\nWorld");
		});
	});
});
