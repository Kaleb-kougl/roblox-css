import { describe, expect, it } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import { renderElement } from "../renderProbe";
import type { InputProps } from "../../primitives/Input";

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

interface TestElement {
	type: string;
	props: Record<string, unknown>;
	ref: unknown;
}

const inputModule = require(uiPrimitives.WaitForChild("Input") as ModuleScript) as {
	Input: React.FC<InputProps> & { render: (props: unknown, ref: unknown) => TestElement };
	makeInputProps: (props: unknown) => InputProps;
};

const Input = inputModule.Input;
const makeInputProps = inputModule.makeInputProps;

describe("Input primitives", () => {
	describe("makeInputProps", () => {
		it("should return the exact same object provided (branded cast)", () => {
			const props = { placeholder: "test" };
			const result = makeInputProps(props);
			expect(result).toBe(props);
		});

		it("should preserve identity of empty objects", () => {
			const input = {};
			const result = makeInputProps(input);
			expect(result).toBe(input);
		});
	});

	describe("Input component", () => {
		const renderInput = (props: unknown, ref: unknown = undefined) => {
			// Runs through a probe component: the primitive calls hooks now.
			return renderElement(Input.render, props, ref);
		};

		it("should render a textbox element without style and onChange", () => {
			const element = renderInput({ BackgroundTransparency: 0.5 });
			
			expect(element).toBeDefined();
			expect(element.type).toBe("TextBox");
			expect(element.props.BackgroundTransparency).toBe(0.5);
			expect(element.props.style).toBeUndefined();
			expect(element.props.children).toBeUndefined();
			expect(element.props.placeholder).toBeUndefined();
			expect(element.props.onChange).toBeUndefined();
		});

		it("should map placeholder to PlaceholderText", () => {
			const element = renderInput({ placeholder: "Enter text..." });
			expect(element.props.PlaceholderText).toBe("Enter text...");
		});

		it("should render explicit children", () => {
			const mockChild = React.createElement("textlabel", { Text: "Hello World" });
			const element = renderInput({ children: mockChild });
			
			expect(element.props.children).toBe(mockChild);
		});

		it("should forward refs correctly", () => {
			const mockRef = React.createRef<TextBox>();
			const element = renderInput({}, mockRef);
			expect(element.ref).toBe(mockRef);
		});

		it("should render with style but no onChange", () => {
			const mockChild = React.createElement("textlabel", { Text: "Hello" });
			const element = renderInput({
				style: { width: "100px", padding: "10px" },
				children: mockChild
			});
			
			expect(element.type).toBe("TextBox");
			
			const size = element.props.Size as UDim2;
			expect(size).toBeDefined();
			expect(size.X.Offset).toBe(100);
			
			const childrenArray = element.props.children as unknown[];
			expect(childrenArray).toBeDefined();
			
			const parsedChildren = childrenArray[0] as TestElement[];
			const explicitChildren = childrenArray[1];
			
			expect(parsedChildren.size()).toBe(1);
			expect(parsedChildren[0].type).toBe("UIPadding");
			expect(explicitChildren).toBe(mockChild);
		});

		it("should render with onChange but no style", () => {
			let changedText = "";
			const handleChange = (text: string) => {
				changedText = text;
			};
			const mockChild = React.createElement("textlabel", { Text: "Child" });
			
			const element = renderInput({
				onChange: handleChange,
				children: mockChild
			});
			
			expect(element.type).toBe("TextBox");
			
			let changeHandler: ((rbx: { Text: string }) => void) | undefined;
			for (const [k, v] of element.props as unknown as Map<unknown, unknown>) {
				if (typeIs(v, "function")) {
					changeHandler = v as (rbx: { Text: string }) => void;
				}
			}

			expect(changeHandler).toBeDefined();
			
			changeHandler!({ Text: "NewText" });
			expect(changedText).toBe("NewText");
			
			expect(element.props.children).toBe(mockChild);
		});

		it("should render with style and onChange", () => {
			let changedText = "";
			const handleChange = (text: string) => {
				changedText = text;
			};
			const mockChild = React.createElement("textlabel", { Text: "Child" });
			const mockRef = React.createRef<TextBox>();
			
			const element = renderInput({
				style: { width: "50px" },
				onChange: handleChange,
				children: mockChild
			}, mockRef);
			
			expect(element.type).toBe("TextBox");
			expect(element.ref).toBe(mockRef);
			
			const size = element.props.Size as UDim2;
			expect(size.X.Offset).toBe(50);
			
			let changeHandler: ((rbx: { Text: string }) => void) | undefined;
			for (const [k, v] of element.props as unknown as Map<unknown, unknown>) {
				if (typeIs(v, "function")) {
					changeHandler = v as (rbx: { Text: string }) => void;
				}
			}

			expect(changeHandler).toBeDefined();
			
			changeHandler!({ Text: "HelloStyle" });
			expect(changedText).toBe("HelloStyle");
			
			const childrenArray = element.props.children as unknown[];
			expect(childrenArray).toBeDefined();
			
			const parsedChildren = childrenArray[0] as TestElement[];
			const explicitChildren = childrenArray[1];
			
			expect(parsedChildren.size()).toBe(0); // No layout constraints for just width
			expect(explicitChildren).toBe(mockChild);
		});

		// ── P1: Change prop merging ──────────────────────────────────

		it("should merge onChange with user Change.Text — both fire", () => {
			let onChangeFired = false;
			let userHandlerFired = false;
			const handleChange = (_text: string) => {
				onChangeFired = true;
			};
			const userTextHandler = (_rbx: TextBox) => {
				userHandlerFired = true;
			};

			const element = renderInput({
				onChange: handleChange,
				Change: { Text: userTextHandler },
			});

			// Find the merged Change table in the rendered element props
			let mergedChange: Record<string, unknown> | undefined;
			for (const [k, v] of element.props as unknown as Map<unknown, unknown>) {
				if (typeIs(v, "table") && !typeIs(v, "function")) {
					// The Change prop is a table with handler functions
					const tbl = v as Record<string, unknown>;
					if (tbl.Text !== undefined) {
						mergedChange = tbl;
					}
				}
			}

			expect(mergedChange).toBeDefined();
			expect(mergedChange!.Text).toBeDefined();

			// Call the merged Text handler — should fire both onChange and user handler
			const textHandler = mergedChange!.Text as (rbx: { Text: string }) => void;
			textHandler({ Text: "test" } as unknown as TextBox);

			expect(onChangeFired).toBe(true);
			expect(userHandlerFired).toBe(true);
		});

		it("should preserve user Change.AbsoluteSize alongside onChange", () => {
			let userAbsSizeFired = false;
			const handleChange = (_text: string) => {};
			const userAbsSizeHandler = (_rbx: TextBox) => {
				userAbsSizeFired = true;
			};

			const element = renderInput({
				onChange: handleChange,
				Change: { AbsoluteSize: userAbsSizeHandler },
			});

			// Find the merged Change table
			let mergedChange: Record<string, unknown> | undefined;
			for (const [k, v] of element.props as unknown as Map<unknown, unknown>) {
				if (typeIs(v, "table") && !typeIs(v, "function")) {
					const tbl = v as Record<string, unknown>;
					if (tbl.Text !== undefined || tbl.AbsoluteSize !== undefined) {
						mergedChange = tbl;
					}
				}
			}

			expect(mergedChange).toBeDefined();
			// onChange creates a Text handler
			expect(mergedChange!.Text).toBeDefined();
			// User's AbsoluteSize handler should be preserved
			expect(mergedChange!.AbsoluteSize).toBeDefined();
		});

		it("should pass through user Change.Text when no onChange is provided", () => {
			let userHandlerFired = false;
			const userTextHandler = (_rbx: TextBox) => {
				userHandlerFired = true;
			};

			const element = renderInput({
				Change: { Text: userTextHandler },
			});

			// Find the Change table — should contain the user's handler directly
			let foundUserHandler = false;
			for (const [_k, v] of element.props as unknown as Map<unknown, unknown>) {
				if (v === userTextHandler) {
					foundUserHandler = true;
				}
				if (typeIs(v, "table") && !typeIs(v, "function")) {
					const tbl = v as Record<string, unknown>;
					if (tbl.Text === userTextHandler) {
						foundUserHandler = true;
					}
				}
			}

			expect(foundUserHandler).toBe(true);
		});
	});
});
