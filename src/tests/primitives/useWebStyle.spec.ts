const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it, afterEach } = _jestGlobals;
const _react = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("react") as ModuleScript
) as typeof import("@rbxts/react");
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

const { useWebStyle } = require(primitivesFolder.WaitForChild("useWebStyle") as ModuleScript) as {
	useWebStyle: (style: unknown, hostText?: string) => { props: Record<string, unknown> } | undefined;
};

describe("useWebStyle", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	/**
	 * Renders `component` once per entry in `styles`, returning the hook result
	 * from each render so tests can compare identity across renders.
	 */
	function renderWithStyles(styles: unknown[], hostTexts?: (string | undefined)[]) {
		// Results are boxed because Luau arrays cannot hold nil elements.
		const results: { value: unknown }[] = [];
		let index = 0;

		const TestComponent = () => {
			const value = useWebStyle(styles[index], hostTexts !== undefined ? hostTexts[index] : undefined);
			results.push({ value });
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		for (let i = 0; i < styles.size(); i++) {
			index = i;
			act(() => {
				root.render(createElement(TestComponent));
			});
		}

		act(() => { root.unmount(); });
		return results;
	}

	it("should export useWebStyle as a function", () => {
		expect(typeIs(useWebStyle, "function")).toBe(true);
	});

	it("should return undefined when called with undefined style", () => {
		const [result] = renderWithStyles([undefined]);
		expect(result.value).toBeUndefined();
	});

	it("should parse the style on first render", () => {
		const [result] = renderWithStyles([{ width: "100px", height: "50px" }]);
		expect(result.value).never.toBeUndefined();
		expect((result.value as { props: Record<string, unknown> }).props.Size).never.toBeUndefined();
	});

	it("should reuse the cached result for a new table with identical values", () => {
		// The point of the shallow comparison: inline style literals allocate a
		// fresh table every render, so identity-keyed caching would never hit.
		const [first, second] = renderWithStyles([
			{ width: "100px", backgroundColor: "#ff0000" },
			{ width: "100px", backgroundColor: "#ff0000" },
		]);
		expect(first.value).never.toBeUndefined();
		expect(second.value).toBe(first.value);
	});

	it("should reparse when a style value changes", () => {
		const [first, second] = renderWithStyles([
			{ width: "100px" },
			{ width: "200px" },
		]);
		expect(second.value).never.toBe(first.value);
	});

	it("should reparse when a style key is added", () => {
		const [first, second] = renderWithStyles([
			{ width: "100px" },
			{ width: "100px", height: "50px" },
		]);
		expect(second.value).never.toBe(first.value);
	});

	it("should reparse when a style key is removed", () => {
		const [first, second] = renderWithStyles([
			{ width: "100px", height: "50px" },
			{ width: "100px" },
		]);
		expect(second.value).never.toBe(first.value);
	});

	it("should reparse when hostText changes but the style does not", () => {
		const [first, second] = renderWithStyles(
			[{ textShadow: "2px 2px #000000" }, { textShadow: "2px 2px #000000" }],
			["Hello", "Goodbye"],
		);
		expect(second.value).never.toBe(first.value);
	});

	it("should not serve a stale result when the caller mutates its style table in place", () => {
		const shared = { width: "100px" } as Record<string, unknown>;
		const results: { value: unknown }[] = [];

		const TestComponent = () => {
			results.push({ value: useWebStyle(shared) });
			return createElement("Frame");
		};

		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => { root.render(createElement(TestComponent)); });
		shared.width = "200px";
		act(() => { root.render(createElement(TestComponent)); });
		act(() => { root.unmount(); });

		expect(results[1].value).never.toBe(results[0].value);
	});
});
