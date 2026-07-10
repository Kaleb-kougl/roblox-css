import { describe, expect, it } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import type { ScreenContainerProps } from "../../src/primitives/ScreenContainer";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiPrimitives = robloxCSS.WaitForChild("primitives");

interface TestElement {
	type: string;
	props: Record<string, unknown>;
	ref: unknown;
}

const screenContainerModule = require(uiPrimitives.WaitForChild("ScreenContainer") as ModuleScript) as {
	ScreenContainer: React.FC<ScreenContainerProps> & { render: (props: unknown, ref: unknown) => TestElement };
	makeScreenContainerProps: (props: unknown) => ScreenContainerProps;
};

const ScreenContainer = screenContainerModule.ScreenContainer;
const makeScreenContainerProps = screenContainerModule.makeScreenContainerProps;

describe("ScreenContainer primitive", () => {
	const renderScreenContainer = (props: unknown, ref: unknown = undefined) => {
		return ScreenContainer.render(props, ref);
	};

	describe("makeScreenContainerProps", () => {
		it("should return the exact same object provided (branded cast)", () => {
			const props = { DisplayOrder: 10 };
			const result = makeScreenContainerProps(props);
			expect(result).toBe(props);
		});
	});

	it("should render a ScreenGui element", () => {
		const element = renderScreenContainer({});

		expect(element).toBeDefined();
		expect(element.type).toBe("ScreenGui");
	});

	it("should use Roblox on-screen container defaults for interactive UI", () => {
		const element = renderScreenContainer({});

		expect(element.props.Enabled).toBe(true);
		expect(element.props.DisplayOrder).toBe(0);
		expect(element.props.ResetOnSpawn).toBe(false);
		expect(element.props.ScreenInsets).toBe(Enum.ScreenInsets.CoreUISafeInsets);
		expect(element.props.ZIndexBehavior).toBe(Enum.ZIndexBehavior.Sibling);
	});

	it("should allow explicit props to choose layering, visibility, spawn resets, and inset behavior", () => {
		const element = renderScreenContainer({
			Enabled: false,
			DisplayOrder: 100,
			ResetOnSpawn: true,
			ScreenInsets: Enum.ScreenInsets.None,
			ZIndexBehavior: Enum.ZIndexBehavior.Global,
		});

		expect(element.props.Enabled).toBe(false);
		expect(element.props.DisplayOrder).toBe(100);
		expect(element.props.ResetOnSpawn).toBe(true);
		expect(element.props.ScreenInsets).toBe(Enum.ScreenInsets.None);
		expect(element.props.ZIndexBehavior).toBe(Enum.ZIndexBehavior.Global);
	});

	it("should preserve child GuiObjects", () => {
		const child = React.createElement("frame", { BackgroundTransparency: 1 });
		const element = renderScreenContainer({ children: child });

		expect(element.props.children).toBe(child);
	});

	it("should forward refs correctly", () => {
		const ref = React.createRef<ScreenGui>();
		const element = renderScreenContainer({}, ref);

		expect(element.ref).toBe(ref);
	});
});
