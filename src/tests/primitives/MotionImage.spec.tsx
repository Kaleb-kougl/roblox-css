import React, { createElement } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import { describe, expect, it, afterEach } from "@rbxts/jest-globals";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const primitivesFolder = robloxCSS.WaitForChild("primitives");
const { MotionImage } = require(primitivesFolder.WaitForChild("MotionImage") as ModuleScript) as {
	MotionImage: React.FunctionComponent<any>;
};

describe("MotionImage Component", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export MotionImage as a function or table", () => {
		expect(typeIs(MotionImage, "function") || typeIs(MotionImage, "table")).toBe(true);
	});

	it("should render an ImageLabel instance without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionImage));
		});

		const image = container.FindFirstChildWhichIsA("ImageLabel");
		expect(image).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should map src prop to the Image property of the ImageLabel", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionImage, { src: "rbxassetid://12345" }));
		});

		const image = container.FindFirstChildWhichIsA("ImageLabel") as ImageLabel;
		expect(image.Image).toBe("rbxassetid://12345");

		act(() => {
			root.unmount();
		});
	});

	it("should apply default BackgroundTransparency of 1", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionImage));
		});

		const image = container.FindFirstChildWhichIsA("ImageLabel") as ImageLabel;
		expect(image.BackgroundTransparency).toBe(1);

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
				createElement(MotionImage, undefined, 
					createElement("textlabel", { Text: "ChildText" })
				)
			);
		});

		const image = container.FindFirstChildWhichIsA("ImageLabel") as ImageLabel;
		const child = image.FindFirstChildWhichIsA("TextLabel");
		expect(child).toBeDefined();
		expect(child?.Text).toBe("ChildText");

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
			root.render(createElement(MotionImage, { variants: variants, animate: "visible" }));
		});

		const image = container.FindFirstChildWhichIsA("ImageLabel") as ImageLabel;
		expect(image).toBeDefined();

		act(() => {
			root.unmount();
		});
	});
});
