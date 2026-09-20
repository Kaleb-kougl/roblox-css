import React, { createElement } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import { describe, expect, it, afterEach } from "@rbxts/jest-globals";
import type { CSSProperties } from "../../styles/CSSTypes";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const primitivesFolder = robloxCSS.WaitForChild("primitives");
const { InlineText } = require(primitivesFolder.WaitForChild("InlineText") as ModuleScript) as {
	InlineText: React.FunctionComponent<any>;
};

describe("InlineText Component", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export InlineText as a function or table", () => {
		expect(typeIs(InlineText, "function") || typeIs(InlineText, "table")).toBe(true);
	});

	it("should apply opacity math to the Transparency properties of its children", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(
				createElement(InlineText, {
					Text: 'Hello <img src="rbxassetid://123" width="20" height="20" /> World',
					style: {
						opacity: 0.5,
					} as CSSProperties,
				})
			);
		});

		// The component should render a Box (Frame) with display: flex, containing Text and Image segments
		const frame = container.FindFirstChildWhichIsA("Frame") as Frame;
		expect(frame).toBeDefined();
		expect(frame.BackgroundTransparency).toBe(0.5); // Box handles BackgroundTransparency based on opacity

		const textLabel = frame.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel).toBeDefined();
		expect(textLabel.TextTransparency).toBe(0.5); // Text component maps opacity to TextTransparency

		const imageLabel = frame.FindFirstChildWhichIsA("ImageLabel") as ImageLabel;
		expect(imageLabel).toBeDefined();
		expect(imageLabel.ImageTransparency).toBe(0.5); // Image component maps opacity to ImageTransparency

		act(() => {
			root.unmount();
		});
	});
});
