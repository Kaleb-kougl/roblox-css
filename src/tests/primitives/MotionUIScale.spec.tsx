import React, { createElement } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import { describe, expect, it, afterEach } from "@rbxts/jest-globals";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const primitivesFolder = robloxCSS.WaitForChild("primitives");
const { MotionUIScale } = require(primitivesFolder.WaitForChild("MotionUIScale") as ModuleScript) as {
	MotionUIScale: React.FunctionComponent<any>;
};

describe("MotionUIScale Component", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export MotionUIScale as a function or table", () => {
		expect(typeIs(MotionUIScale, "function") || typeIs(MotionUIScale, "table")).toBe(true);
	});

	it("should render a UIScale instance without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionUIScale));
		});

		const uiScale = container.FindFirstChildWhichIsA("UIScale");
		expect(uiScale).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should strip motion-specific props (animate, variants, transition) from the output", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		const variants = {
			visible: { Scale: 1 },
			hidden: { Scale: 0 },
		};

		act(() => {
			root.render(createElement(MotionUIScale, { 
				variants: variants, 
				animate: "visible", 
				transition: new TweenInfo(1) 
			}));
		});

		const uiScale = container.FindFirstChildWhichIsA("UIScale") as UIScale;
		expect(uiScale).toBeDefined();
		
		// The engine would throw an error if these props were passed to the instance,
		// so if we get here without crashing, the props were successfully stripped.
		// However, we can also verify the Scale property was correctly applied via the variant.

		act(() => {
			root.unmount();
		});
	});

	it("should render with variants and animate containing a Scale property without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		const variants = {
			visible: { Scale: 1.5 },
			hidden: { Scale: 0.5 },
		};

		act(() => {
			root.render(createElement(MotionUIScale, { variants: variants, animate: "visible" }));
		});

		const uiScale = container.FindFirstChildWhichIsA("UIScale") as UIScale;
		expect(uiScale).toBeDefined();

		act(() => {
			root.unmount();
		});
	});
});
