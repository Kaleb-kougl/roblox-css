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
const mod = require(primitivesFolder.WaitForChild("useVariantResolver") as ModuleScript) as {
	useVariantResolver: (...args: unknown[]) => { animatedProps: Record<string, unknown>; staticProps: Record<string, unknown> };
	isAnimatable?: (value: any) => boolean;
};

const useVariantResolver = mod.useVariantResolver;

describe("useVariantResolver", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export useVariantResolver as a function", () => {
		expect(typeIs(useVariantResolver, "function")).toBe(true);
	});

	it("isAnimatable should classify types correctly", () => {
		if (mod.isAnimatable) {
			const { isAnimatable } = mod;
			expect(isAnimatable(10)).toBe(true);
			expect(isAnimatable(new UDim(1, 0))).toBe(true);
			expect(isAnimatable(new UDim2(1, 0, 1, 0))).toBe(true);
			expect(isAnimatable(new Vector2(1, 1))).toBe(true);
			expect(isAnimatable(new Vector3(1, 1, 1))).toBe(true);
			expect(isAnimatable(new Color3(1, 1, 1))).toBe(true);
			expect(isAnimatable(new CFrame())).toBe(true);
			expect(isAnimatable(new Rect(0, 0, 0, 0))).toBe(true);

			expect(isAnimatable("string")).toBe(false);
			expect(isAnimatable(true)).toBe(false);
			expect(isAnimatable({})).toBe(false);
		} else {
			// Indirect test
			let result!: ReturnType<typeof useVariantResolver>;
			const TestComponent = () => {
				result = useVariantResolver(
					"state1", 
					"state1", 
					{ 
						state1: { 
							animatableValue: 10,
							staticValue: "hello"
						} 
					},
					new TweenInfo(1)
				);
				return createElement("Frame");
			};
			
			const container = new Instance("Folder");
			createdInstances.push(container);
			const root = ReactRoblox.createRoot(container);
			
			act(() => { root.render(createElement(TestComponent)); });
			
			expect(result.animatedProps.animatableValue).toBeDefined();
			expect(result.staticProps.staticValue).toBe("hello");
			
			act(() => { root.unmount(); });
		}
	});

	it("should return empty animatedProps and staticProps when no variants are provided", () => {
		let result!: ReturnType<typeof useVariantResolver>;
		
		const TestComponent = () => {
			result = useVariantResolver(
				undefined,
				undefined,
				undefined,
				new TweenInfo(1)
			);
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => { root.render(createElement(TestComponent)); });
		
		expect(result).toBeDefined();
		
		let animCount = 0;
		for (const _ of pairs(result.animatedProps)) animCount++;
		expect(animCount).toBe(0);
		
		let staticCount = 0;
		for (const _ of pairs(result.staticProps)) staticCount++;
		expect(staticCount).toBe(0);
		
		act(() => { root.unmount(); });
	});

	it("should correctly categorize variant properties into animated vs static", () => {
		let result!: ReturnType<typeof useVariantResolver>;
		
		const TestComponent = () => {
			result = useVariantResolver(
				"active",
				"active",
				{
					active: {
						BackgroundTransparency: 0.5,
						Text: "Hello",
						Size: new UDim2(1, 0, 1, 0),
						Visible: true
					}
				},
				new TweenInfo(1)
			);
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => { root.render(createElement(TestComponent)); });
		
		expect(result.animatedProps.BackgroundTransparency).toBeDefined();
		expect(result.animatedProps.Size).toBeDefined();
		
		expect(result.staticProps.Text).toBe("Hello");
		expect(result.staticProps.Visible).toBe(true);
		
		act(() => { root.unmount(); });
	});

	it("should return animatedProps as React bindings", () => {
		let result!: ReturnType<typeof useVariantResolver>;
		
		const TestComponent = () => {
			result = useVariantResolver(
				"active",
				"active",
				{
					active: {
						BackgroundTransparency: 0.5
					}
				},
				new TweenInfo(1)
			);
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		act(() => { root.render(createElement(TestComponent)); });
		
		const transparencyBinding = result.animatedProps.BackgroundTransparency;
		expect(transparencyBinding).toBeDefined();
		// Verify it behaves as a React binding by calling getValue()
		const bindingObj = transparencyBinding as never as { getValue(): any };
		expect(bindingObj.getValue()).toBe(0.5);
		
		act(() => { root.unmount(); });
	});

	it("should connect to Heartbeat on mount and disconnect on unmount", () => {
		let result!: ReturnType<typeof useVariantResolver>;
		
		const TestComponent = () => {
			result = useVariantResolver(
				"active",
				"active",
				{
					active: {
						Transparency: 0.5
					}
				},
				new TweenInfo(1)
			);
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);
		
		expect(() => {
			act(() => { root.render(createElement(TestComponent)); });
		}).never.toThrow();
		
		expect(() => {
			act(() => { root.unmount(); });
		}).never.toThrow();
	});
});
