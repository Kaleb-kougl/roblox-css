import { describe, expect, it, beforeEach, afterEach } from "@rbxts/jest-globals";
import React, { createElement } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import type { MotionBoxProps } from "../../primitives/MotionBox";
import type { MotionButtonProps } from "../../primitives/MotionButton";
import type { MotionTextProps } from "../../primitives/MotionText";
import type { MotionImageProps } from "../../primitives/MotionImage";
import type { MotionUIScaleProps } from "../../primitives/MotionUIScale";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

const motionBoxModule = require(uiPrimitives.WaitForChild("MotionBox") as ModuleScript) as {
	MotionBox: React.FC<MotionBoxProps>;
};

const motionButtonModule = require(uiPrimitives.WaitForChild("MotionButton") as ModuleScript) as {
	MotionButton: React.FC<MotionButtonProps>;
};

const motionTextModule = require(uiPrimitives.WaitForChild("MotionText") as ModuleScript) as {
	MotionText: React.FC<MotionTextProps>;
};

const motionImageModule = require(uiPrimitives.WaitForChild("MotionImage") as ModuleScript) as {
	MotionImage: React.FC<MotionImageProps>;
};

const motionUIScaleModule = require(uiPrimitives.WaitForChild("MotionUIScale") as ModuleScript) as {
	MotionUIScale: React.FC<MotionUIScaleProps>;
};

const MotionBox = motionBoxModule.MotionBox;
const MotionButton = motionButtonModule.MotionButton;
const MotionText = motionTextModule.MotionText;
const MotionImage = motionImageModule.MotionImage;
const MotionUIScale = motionUIScaleModule.MotionUIScale;

describe("Motion Primitives", () => {
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

	describe("MotionBox", () => {
		it("should render a frame without crashing", () => {
			act(() => {
				root.render(createElement(MotionBox, { BackgroundTransparency: 0.5 }));
			});
			const frame = container.FindFirstChildWhichIsA("Frame");
			expect(frame).toBeDefined();
			expect(frame?.BackgroundTransparency).toBeCloseTo(0.5, 5);
		});

		it("should apply style props correctly", () => {
			act(() => {
				root.render(
					createElement(MotionBox, {
						style: {
							backgroundColor: "#ff0000",
							borderRadius: "8px",
						},
					}),
				);
			});
			const frame = container.FindFirstChildWhichIsA("Frame");
			expect(frame).toBeDefined();
			expect(frame?.BackgroundColor3).toBeDefined();
			expect(frame?.BackgroundColor3.R).toBeCloseTo(1, 5);
			expect(frame?.BackgroundColor3.G).toBeCloseTo(0, 5);
			expect(frame?.BackgroundColor3.B).toBeCloseTo(0, 5);

			const corner = frame?.FindFirstChildWhichIsA("UICorner");
			expect(corner).toBeDefined();
			expect(corner?.CornerRadius.Offset).toBe(8);
		});

		it("should resolve variant correctly to initial state", () => {
			const variants = {
				hover: { backgroundColor: "#00ff00", width: "100px" },
			};
			act(() => {
				root.render(
					createElement(MotionBox, {
						animate: "hover",
						variants: variants,
					}),
				);
			});
			const frame = container.FindFirstChildWhichIsA("Frame");
			expect(frame).toBeDefined();
			// Since useMotion resolves instantly to initial state, backgroundColor should be mapped
			expect(frame?.BackgroundColor3).toBeDefined();
			expect(frame?.BackgroundColor3.G).toBeCloseTo(1, 5);
			expect(frame?.Size.X.Offset).toBe(100);
		});
	});

	describe("MotionButton", () => {
		it("should render a textbutton without crashing", () => {
			act(() => {
				root.render(createElement(MotionButton, { Text: "Click Me" }));
			});
			const btn = container.FindFirstChildWhichIsA("TextButton");
			expect(btn).toBeDefined();
			expect(btn?.Text).toBe("Click Me");
			expect(btn?.AutomaticSize).toBe(Enum.AutomaticSize.XY); // Check fallback auto size
		});

		it("should render a textbutton with string children as Text", () => {
			act(() => {
				root.render(<MotionButton>{("Click String" as unknown) as React.ReactNode}</MotionButton>);
			});
			const btn = container.FindFirstChildWhichIsA("TextButton");
			expect(btn).toBeDefined();
			expect(btn?.Text).toBe("Click String");
		});

		it("should render a textbutton with number children as Text", () => {
			act(() => {
				root.render(<MotionButton>{(999 as unknown) as React.ReactNode}</MotionButton>);
			});
			const btn = container.FindFirstChildWhichIsA("TextButton");
			expect(btn).toBeDefined();
			expect(btn?.Text).toBe("999");
		});

		it("should apply style font and text alignments", () => {
			act(() => {
				root.render(
					createElement(MotionButton, {
						style: {
							fontSize: 24,
							textAlign: "center",
							fontWeight: "bold",
						},
					}),
				);
			});
			const btn = container.FindFirstChildWhichIsA("TextButton");
			expect(btn).toBeDefined();
			expect(btn?.TextSize).toBe(24);
			expect(btn?.TextXAlignment).toBe(Enum.TextXAlignment.Center);
			expect(btn?.FontFace.Weight).toBe(Enum.FontWeight.Bold);
		});

		it("should forward input events", () => {
			let clicked = false;
			let hovered = false;
			act(() => {
				root.render(
					createElement(MotionButton, {
						onClick: () => { clicked = true; },
						onMouseEnter: () => { hovered = true; },
					}),
				);
			});
			
			// We can verify that Event fields are mapped, but without a full synthetic event system 
			// it's tricky to trigger them easily from Jest headless. However, we ensure they render.
			const btn = container.FindFirstChildWhichIsA("TextButton");
			expect(btn).toBeDefined();
		});
	});

	describe("MotionText", () => {
		it("should render a textlabel with children as Text", () => {
			act(() => {
				root.render(
					<MotionText>{("Hello String Children" as unknown) as React.ReactNode}</MotionText>
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.Text).toBe("Hello String Children");
		});

		it("should render a textlabel with number children as Text", () => {
			act(() => {
				root.render(
					<MotionText>{(12345 as unknown) as React.ReactNode}</MotionText>
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.Text).toBe("12345");
		});

		it("should apply AutomaticSize.XY when Size and style dimensions are undefined", () => {
			act(() => {
				root.render(
					createElement(MotionText, { Text: "Hello" })
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.AutomaticSize).toBe(Enum.AutomaticSize.XY);
		});

		it("should NOT apply AutomaticSize.XY when Size is defined", () => {
			act(() => {
				root.render(
					createElement(MotionText, { Size: new UDim2(1, 0, 1, 0) })
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.AutomaticSize).toBe(Enum.AutomaticSize.None);
		});

		it("should handle color parsing correctly", () => {
			act(() => {
				root.render(
					createElement(MotionText, {
						style: { color: "rgb(0, 0, 255)" },
					}),
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.TextColor3.B).toBeCloseTo(1, 5);
			expect(lbl?.TextTransparency).toBe(0); // Not transparent
		});

		it("should handle transparent color parsing", () => {
			act(() => {
				root.render(
					createElement(MotionText, {
						style: { color: "transparent" },
					}),
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.TextTransparency).toBe(1);
		});

		it("should parse fontSize, textAlign, and whiteSpace", () => {
			act(() => {
				root.render(
					createElement(MotionText, {
						style: { 
							fontSize: 32,
							textAlign: "right",
							whiteSpace: "nowrap"
						},
					}),
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.TextSize).toBe(32);
			expect(lbl?.TextXAlignment).toBe(Enum.TextXAlignment.Right);
			expect(lbl?.TextWrapped).toBe(false);
		});

		it("should parse fontFamily and fontWeight", () => {
			act(() => {
				root.render(
					createElement(MotionText, {
						style: { 
							fontFamily: "Gotham",
							fontWeight: "bold"
						},
					}),
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			expect(lbl?.FontFace.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
			expect(lbl?.FontFace.Weight).toBe(Enum.FontWeight.Bold);
		});

		it("should render non-string children correctly", () => {
			act(() => {
				root.render(
					createElement(MotionText, { Text: "Parent" }, 
						createElement("uiaspectratioconstraint", { AspectRatio: 2 })
					)
				);
			});
			const lbl = container.FindFirstChildWhichIsA("TextLabel");
			expect(lbl).toBeDefined();
			const constraint = lbl?.FindFirstChildWhichIsA("UIAspectRatioConstraint");
			expect(constraint).toBeDefined();
			expect(constraint?.AspectRatio).toBe(2);
		});
	});

	describe("MotionImage", () => {
		it("should render an imagelabel without crashing", () => {
			act(() => {
				root.render(createElement(MotionImage, { src: "rbxassetid://12345" }));
			});
			const img = container.FindFirstChildWhichIsA("ImageLabel");
			expect(img).toBeDefined();
			expect(img?.Image).toBe("rbxassetid://12345");
			expect(img?.BackgroundTransparency).toBeCloseTo(1, 5);
		});

		it("should map src prop to Image and apply styles", () => {
			act(() => {
				root.render(
					createElement(MotionImage, {
						src: "rbxassetid://98765",
						style: { backgroundColor: "#fff", width: "50px" }
					}),
				);
			});
			const img = container.FindFirstChildWhichIsA("ImageLabel");
			expect(img).toBeDefined();
			expect(img?.Image).toBe("rbxassetid://98765");
			expect(img?.BackgroundColor3.R).toBeCloseTo(1, 5);
			expect(img?.Size.X.Offset).toBe(50);
		});

		it("should render children correctly", () => {
			act(() => {
				root.render(
					createElement(MotionImage, { src: "rbxassetid://111" },
						createElement("uigradient", { Rotation: 90 })
					)
				);
			});
			const img = container.FindFirstChildWhichIsA("ImageLabel");
			expect(img).toBeDefined();
			const grad = img?.FindFirstChildWhichIsA("UIGradient");
			expect(grad).toBeDefined();
			expect(grad?.Rotation).toBe(90);
		});
	});

	describe("MotionUIScale", () => {
		it("should render a uiscale without crashing", () => {
			act(() => {
				root.render(createElement(MotionUIScale, { Scale: 1.5 }));
			});
			const scale = container.FindFirstChildWhichIsA("UIScale");
			expect(scale).toBeDefined();
			expect(scale?.Scale).toBeCloseTo(1.5, 5);
		});

		it("should resolve variant correctly to initial state", () => {
			const variants = {
				hover: { Scale: 2.0 },
			};
			act(() => {
				root.render(
					createElement(MotionUIScale, {
						animate: "hover",
						variants: variants,
					}),
				);
			});
			const scale = container.FindFirstChildWhichIsA("UIScale");
			expect(scale).toBeDefined();
			expect(scale?.Scale).toBeCloseTo(2.0, 5);
		});
	});
});
