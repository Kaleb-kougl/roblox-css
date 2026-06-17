import { describe, it, expect } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { Text } from "../../primitives/Text";

describe("Text primitive textShadow integration", () => {
	it("should properly pass mutated text to webStyle for textShadow", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);
		
		ReactRoblox.act(() => {
			root.render(
				<Text 
					Text="hello shadow"
					style={{ 
						textShadow: "5px 5px #ff0000",
						textTransform: "uppercase" 
					}}
				/>
			);
		});
		
		const mainText = container.FindFirstChildOfClass("TextLabel") as TextLabel;
		expect(mainText).toBeDefined();
		expect(mainText.Text).toBe("HELLO SHADOW");
		
		const shadowChild = mainText.FindFirstChild("textShadow") as TextLabel;
		expect(shadowChild).toBeDefined();
		expect(shadowChild.Text).toBe("HELLO SHADOW");
		expect(shadowChild.Position.X.Offset).toBe(5);
		expect(shadowChild.Position.Y.Offset).toBe(5);
		
		root.unmount();
	});

	it("should apply wordBreak formatting to textShadow", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);
		
		ReactRoblox.act(() => {
			root.render(
				<Text 
					Text="Hello World"
					style={{ 
						textShadow: "2px 2px #0000ff",
						wordBreak: "keep-all" 
					}}
				/>
			);
		});
		
		const mainText = container.FindFirstChildOfClass("TextLabel") as TextLabel;
		expect(mainText).toBeDefined();
		expect(mainText.Text).toBe("Hello\nWorld");
		
		const shadowChild = mainText.FindFirstChild("textShadow") as TextLabel;
		expect(shadowChild).toBeDefined();
		expect(shadowChild.Text).toBe("Hello\nWorld");
		
		root.unmount();
	});
});
