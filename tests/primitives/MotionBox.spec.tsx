import React, { createElement } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import { describe, expect, it, afterEach } from "@rbxts/jest-globals";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const primitivesFolder = robloxCSS.WaitForChild("primitives");
const { MotionBox } = require(primitivesFolder.WaitForChild("MotionBox") as ModuleScript) as {
	MotionBox: React.FunctionComponent<any>;
};

describe("MotionBox Component", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export MotionBox as a function or table", () => {
		expect(typeIs(MotionBox, "function") || typeIs(MotionBox, "table")).toBe(true);
	});

	it("should render a Frame instance without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionBox));
		});

		const frame = container.FindFirstChildWhichIsA("Frame");
		expect(frame).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should apply default BackgroundTransparency of 1 when no explicit override", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionBox));
		});

		const frame = container.FindFirstChildWhichIsA("Frame") as Frame;
		expect(frame.BackgroundTransparency).toBe(1);

		act(() => {
			root.unmount();
		});
	});

	it("should render with style prop and produce child constraint elements from webStyle", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionBox, { style: { width: "100%", maxWidth: 500 } }));
		});

		const frame = container.FindFirstChildWhichIsA("Frame") as Frame;
		expect(frame.Size.X.Scale).toBe(1);
		const constraint = frame.FindFirstChildWhichIsA("UISizeConstraint");
		expect(constraint).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should render with variants and animate without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		const variants = {
			visible: { BackgroundTransparency: 0 },
			hidden: { BackgroundTransparency: 1 },
		};

		act(() => {
			root.render(createElement(MotionBox, { variants: variants, animate: "visible" }));
		});

		const frame = container.FindFirstChildWhichIsA("Frame") as Frame;
		expect(frame).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should render children passed via props.children", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(
				createElement(MotionBox, undefined, 
					createElement("textlabel", { Text: "ChildText" })
				)
			);
		});

		const frame = container.FindFirstChildWhichIsA("Frame") as Frame;
		const child = frame.FindFirstChildWhichIsA("TextLabel");
		expect(child).toBeDefined();
		expect(child?.Text).toBe("ChildText");

		act(() => {
			root.unmount();
		});
	});
});
