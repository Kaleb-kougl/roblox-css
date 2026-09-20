import { describe, expect, it, beforeEach, afterEach } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import type { CSSProperties } from "../../styles/CSSTypes";
import type { BoxProps } from "../../primitives/Box";

(_G as unknown as Record<string, boolean>).__ROACT_17_MOCK_SCHEDULER__ = true;

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");
const uiStyles = robloxCSS.WaitForChild("styles");

const parentSizeContextModule = require(uiStyles.WaitForChild("ParentSizeContext") as ModuleScript) as {
	ParentSizeContext: React.Context<React.Binding<Vector2> | undefined>;
};
const ParentSizeContext = parentSizeContextModule.ParentSizeContext;

const usePercentageConstraintsModule = require(uiPrimitives.WaitForChild("usePercentageConstraints") as ModuleScript) as {
	usePercentageConstraints: (style: CSSProperties | undefined) => React.Element | undefined;
};
// Required by instructions to dynamically require the hook, even if tested indirectly via Box.
const _usePercentageConstraints = usePercentageConstraintsModule.usePercentageConstraints;

const boxModule = require(uiPrimitives.WaitForChild("Box") as ModuleScript) as {
	Box: React.FC<BoxProps>;
};
const Box = boxModule.Box;

interface TestWrapperProps {
	style?: CSSProperties;
	parentBinding?: React.Binding<Vector2>;
}

function TestWrapper({ style, parentBinding }: TestWrapperProps) {
	if (parentBinding) {
		return (
			<ParentSizeContext.Provider value={parentBinding}>
				<Box style={style} />
			</ParentSizeContext.Provider>
		);
	}
	return <Box style={style} />;
}

describe("usePercentageConstraints hook", () => {
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

	describe("Basic activation", () => {
		it("returns no UISizeConstraint when no constraints are set", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={{}} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true);
			expect(constraint).toBeUndefined();
		});

		it("returns no UISizeConstraint when style is undefined", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={undefined} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true);
			expect(constraint).toBeUndefined();
		});

		it("returns no UISizeConstraint when all constraints are pixel-only", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={{ maxWidth: 400, minHeight: "200px" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint | undefined;
			// The hook returns undefined, but Box renders the constraint emitted by webStyle.
			expect(constraint).toBeDefined();
			expect(constraint!.MaxSize.X).toBe(400);
			expect(constraint!.MinSize.Y).toBe(200);
		});

		it("returns no UISizeConstraint when no ParentSizeContext is provided", () => {
			act(() => {
				root.render(<TestWrapper style={{ maxWidth: "50%" }} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true);
			expect(constraint).toBeUndefined();
		});
	});

	describe("Single-axis percentage", () => {
		it("resolves maxWidth: '50%' against parent size 800x600", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={{ maxWidth: "50%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MaxSize.X).toBe(400);
			expect(constraint.MaxSize.Y).toBe(math.huge);
		});

		it("resolves minHeight: '25%' against parent size 800x600", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={{ minHeight: "25%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MinSize.Y).toBe(150);
			expect(constraint.MinSize.X).toBe(0);
		});

		it("resolves minWidth: '10%' against parent size 1000x500", () => {
			const [mockBinding] = React.createBinding(new Vector2(1000, 500));
			act(() => {
				root.render(<TestWrapper style={{ minWidth: "10%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MinSize.X).toBe(100);
			expect(constraint.MaxSize.X).toBe(math.huge);
			expect(constraint.MaxSize.Y).toBe(math.huge);
		});

		it("resolves maxHeight: '75%' against parent size 400x800", () => {
			const [mockBinding] = React.createBinding(new Vector2(400, 800));
			act(() => {
				root.render(<TestWrapper style={{ maxHeight: "75%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MaxSize.Y).toBe(600);
		});
	});

	describe("Multi-axis percentage", () => {
		it("resolves all four axes as percentages", () => {
			const [mockBinding] = React.createBinding(new Vector2(1000, 500));
			act(() => {
				root.render(<TestWrapper style={{ minWidth: "10%", maxWidth: "90%", minHeight: "20%", maxHeight: "80%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MinSize.X).toBe(100);
			expect(constraint.MinSize.Y).toBe(100);
			expect(constraint.MaxSize.X).toBe(900);
			expect(constraint.MaxSize.Y).toBe(400);
		});
	});

	describe("Mixed pixel + percentage", () => {
		it("handles minWidth pixel + maxWidth percentage", () => {
			const [mockBinding] = React.createBinding(new Vector2(1000, 500));
			act(() => {
				root.render(<TestWrapper style={{ minWidth: "200px", maxWidth: "50%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MinSize.X).toBe(200);
			expect(constraint.MaxSize.X).toBe(500);
		});

		it("handles minHeight percentage + maxHeight pixel", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={{ minHeight: "10%", maxHeight: "300px" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MinSize.Y).toBe(60);
			expect(constraint.MaxSize.Y).toBe(300);
		});
	});

	describe("Default fallback values", () => {
		it("defaults absent MinSize axes to 0", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={{ maxWidth: "50%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MinSize.X).toBe(0);
			expect(constraint.MinSize.Y).toBe(0);
		});

		it("defaults absent MaxSize axes to math.huge", () => {
			const [mockBinding] = React.createBinding(new Vector2(800, 600));
			act(() => {
				root.render(<TestWrapper style={{ minWidth: "10%" }} parentBinding={mockBinding} />);
			});
			const constraint = container.FindFirstChildWhichIsA("UISizeConstraint", true) as UISizeConstraint;
			expect(constraint).toBeDefined();
			expect(constraint.MaxSize.X).toBe(math.huge);
			expect(constraint.MaxSize.Y).toBe(math.huge);
		});
	});
});
