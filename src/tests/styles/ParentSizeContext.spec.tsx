import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { describe, expect, it } from "@rbxts/jest-globals";

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

const ParentSizeContextModule = require(uiStyles.WaitForChild("ParentSizeContext") as ModuleScript) as {
	ParentSizeContext: React.Context<React.Binding<Vector2> | undefined>;
};
const ParentSizeContext = ParentSizeContextModule.ParentSizeContext;

describe("ParentSizeContext", () => {
	it("exports ParentSizeContext as a defined value", () => {
		expect(ParentSizeContext).toBeDefined();
	});

	it("ParentSizeContext is a table (React Context object)", () => {
		expect(typeIs(ParentSizeContext, "table")).toBe(true);
	});

	it("has a Provider property", () => {
		expect(ParentSizeContext.Provider).toBeDefined();
	});

	it("default context value is undefined", () => {
		let capturedValue: unknown = "not-undefined";

		const TestConsumer = () => {
			const value = React.useContext(ParentSizeContext);
			capturedValue = value;
			return <></>;
		};

		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);

		ReactRoblox.act(() => {
			root.render(<TestConsumer />);
		});

		expect(capturedValue).toBeUndefined();

		root.unmount();
	});
});
