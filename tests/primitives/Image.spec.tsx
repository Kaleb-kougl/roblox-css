import { describe, expect, it } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import type { ImageProps } from "../../src/primitives/Image";

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

interface TestElement {
	type: string;
	props: Record<string, unknown>;
	ref: unknown;
}

const imageModule = require(uiPrimitives.WaitForChild("Image") as ModuleScript) as {
	Image: React.FC<ImageProps> & { render: (props: unknown, ref: unknown) => TestElement };
	makeImageProps: (props: unknown) => ImageProps;
};

const Image = imageModule.Image;
const makeImageProps = imageModule.makeImageProps;

describe("Image primitives", () => {
	describe("makeImageProps", () => {
		it("should return the exact same object provided (branded cast)", () => {
			const input = { src: "rbxassetid://12345" };
			const result = makeImageProps(input);
			expect(result).toBe(input);
		});

		it("should preserve identity of empty objects", () => {
			const input = {};
			const result = makeImageProps(input);
			expect(result).toBe(input);
		});
	});

	describe("Image component", () => {
		const renderImage = (props: unknown, ref: unknown = undefined) => {
			return Image.render(props, ref);
		};

		it("should apply opacity math to ImageTransparency", () => {
			const element = renderImage({
				style: { opacity: 0.5 },
			});
			expect(element.props.ImageTransparency).toBe(0.5);
		});

		it("should apply opacity math to existing ImageTransparency in style", () => {
			const element = renderImage({
				style: { opacity: 0.5, ImageTransparency: 0.5 } as any,
			});
			expect(element.props.ImageTransparency).toBe(0.75);
		});

		it("should render an imagelabel element without style or src", () => {
			const element = renderImage({ BackgroundColor3: new Color3(1, 0, 0) });
			
			expect(element).toBeDefined();
			expect(element.type).toBe("ImageLabel");
			
			// Native props passed through
			expect(element.props.BackgroundColor3).toBeDefined();
			const color = element.props.BackgroundColor3 as Color3;
			expect(color.R).toBe(1);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);

			// Defaults should be applied
			expect(element.props.BackgroundTransparency).toBe(1);
			
			// Custom props should be stripped
			expect(element.props.style).toBeUndefined();
			expect(element.props.src).toBeUndefined();
			
			// Image property should not be set if src wasn't passed
			expect(element.props.Image).toBeUndefined();
		});

		it("should map src prop to Image property", () => {
			const element = renderImage({ src: "rbxassetid://12345" });
			
			expect(element.type).toBe("ImageLabel");
			expect(element.props.Image).toBe("rbxassetid://12345");
			expect(element.props.src).toBeUndefined();
		});

		it("should apply webStyle and merge its props and children", () => {
			const element = renderImage({
				style: {
					width: "100px",
					borderRadius: "5px",
				},
				src: "rbxassetid://54321",
			});
			
			expect(element.type).toBe("ImageLabel");
			
			// Explicit props mapped
			expect(element.props.Image).toBe("rbxassetid://54321");
			
			// Style props should be mapped
			const size = element.props.Size as UDim2;
			expect(size).toBeDefined();
			expect(size.X.Offset).toBe(100);
			expect(size.Y.Scale).toBeCloseTo(1, 5); // webStyle defaults height to 100%
			
			// Style children should be injected
			expect(element.props.children).toBeDefined();
			
			// React stores multiple children as an array.
			const childrenArray = element.props.children as unknown[];
			const parsedChildren = childrenArray[0] as TestElement[];
			
			expect(parsedChildren).toBeDefined();
			expect(parsedChildren.size()).toBe(1); // One constraint (UICorner for borderRadius)
			expect(parsedChildren[0].type).toBe("UICorner");
			expect((parsedChildren[0].props.CornerRadius as UDim).Offset).toBe(5);
		});

		it("should let explicit props override style props due to spread order", () => {
			// Image.tsx uses: <imagelabel {...defaultProps} {...parsedStyleProps} {...explicitProps}>
			// Therefore, explicit props should overwrite parsedStyleProps.
			const element = renderImage({
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

		it("should render explicit children alongside style children", () => {
			const mockChild = React.createElement("textlabel", { Text: "Hello World" });
			const element = renderImage({
				style: { padding: "10px" },
				children: mockChild,
			});

			expect(element.type).toBe("ImageLabel");
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
			const mockRef = React.createRef<ImageLabel>();
			const element = renderImage({}, mockRef);
			
			expect(element.ref).toBe(mockRef);
		});

		it("should forward refs correctly when style is provided", () => {
			const mockRef = React.createRef<ImageLabel>();
			const element = renderImage({ style: { width: "10px" } }, mockRef);
			
			expect(element.ref).toBe(mockRef);
		});
	});
});
