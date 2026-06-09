const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it, beforeEach, afterEach } = _jestGlobals;
const _react = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("react") as ModuleScript
) as typeof import("@rbxts/react");
const React = _react;
const { createElement } = _react;
const _reactRoblox = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("react-roblox") as ModuleScript
) as typeof import("@rbxts/react-roblox");
const ReactRoblox = _reactRoblox;
const { act } = _reactRoblox;

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const primitivesFolder = robloxCSS.WaitForChild("primitives");
const stylesFolder = robloxCSS.WaitForChild("styles");

const { usePercentageConstraints } = require(primitivesFolder.WaitForChild("usePercentageConstraints") as ModuleScript) as {
	usePercentageConstraints: (style: any) => React.ReactNode;
};

const { ParentSizeContext } = require(stylesFolder.WaitForChild("ParentSizeContext") as ModuleScript) as {
	ParentSizeContext: React.Context<React.Binding<Vector2> | undefined>;
};

describe("usePercentageConstraints", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export usePercentageConstraints as a function", () => {
		expect(typeIs(usePercentageConstraints, "function")).toBe(true);
	});

	it("should return undefined when called with undefined style", () => {
		let result: any = "NOT_SET";
		
		const TestComponent = () => {
			result = usePercentageConstraints(undefined);
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => {
			root.render(createElement(TestComponent));
		});
		
		expect(result).toBeUndefined();
		
		act(() => { root.unmount(); });
	});

	it("should return undefined when no ParentSizeContext is provided", () => {
		let result: any = "NOT_SET";
		
		const TestComponent = () => {
			result = usePercentageConstraints({ width: "50%" });
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => {
			// No provider!
			root.render(createElement(TestComponent));
		});
		
		expect(result).toBeUndefined();
		
		act(() => { root.unmount(); });
	});

	it("should return undefined when constraint dimensions have zero Scale", () => {
		let result: any = "NOT_SET";
		const [parentSizeBinding] = React.createBinding(new Vector2(100, 100));

		const TestComponent = () => {
			result = usePercentageConstraints({ minWidth: "20px", maxWidth: 50 });
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => {
			root.render(
				createElement(ParentSizeContext.Provider, { value: parentSizeBinding }, 
					createElement(TestComponent)
				)
			);
		});
		
		expect(result).toBeUndefined();
		
		act(() => { root.unmount(); });
	});

	it("should return a uisizeconstraint element when a percentage constraint is present", () => {
		let result: any = "NOT_SET";
		const [parentSizeBinding] = React.createBinding(new Vector2(100, 100));

		const TestComponent = () => {
			result = usePercentageConstraints({ maxWidth: "50%" });
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => {
			root.render(
				createElement(ParentSizeContext.Provider, { value: parentSizeBinding }, 
					createElement(TestComponent)
				)
			);
		});
		
		expect(result).toBeDefined();
		expect((result as { type: string }).type).toBe("UISizeConstraint");
		
		act(() => { root.unmount(); });
	});

	it("should correctly compute MinSize/MaxSize bindings from percentage constraints", () => {
		const [parentSizeBinding, setParentSize] = React.createBinding(new Vector2(200, 400));
		
		const TestComponent = () => {
			const constraint = usePercentageConstraints({
				minWidth: "10%",
				minHeight: "20%",
				maxWidth: "50%",
				maxHeight: "80%"
			});
			return createElement("Frame", {}, constraint);
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => {
			root.render(
				createElement(ParentSizeContext.Provider, { value: parentSizeBinding }, 
					createElement(TestComponent)
				)
			);
		});
		
		const frame = container.FindFirstChildOfClass("Frame") as Frame;
		expect(frame).toBeDefined();
		
		const constraint = frame.FindFirstChildOfClass("UISizeConstraint") as UISizeConstraint;
		expect(constraint).toBeDefined();
		
		// 10% of 200 = 20, 20% of 400 = 80
		expect(constraint.MinSize.X).toBe(20);
		expect(constraint.MinSize.Y).toBe(80);
		
		// 50% of 200 = 100, 80% of 400 = 320
		expect(constraint.MaxSize.X).toBe(100);
		expect(constraint.MaxSize.Y).toBe(320);

		// Verify reactive updating
		act(() => {
			setParentSize(new Vector2(1000, 1000));
		});

		expect(constraint.MinSize.X).toBe(100);
		expect(constraint.MinSize.Y).toBe(200);
		expect(constraint.MaxSize.X).toBe(500);
		expect(constraint.MaxSize.Y).toBe(800);
		
		act(() => { root.unmount(); });
	});
});
